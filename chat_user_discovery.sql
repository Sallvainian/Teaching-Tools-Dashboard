-- User Discovery Functions for Chat System
-- These functions determine who users can start conversations with

-- Function to get available chat users for the current user
CREATE OR REPLACE FUNCTION get_available_chat_users()
RETURNS TABLE (
    user_id UUID,
    full_name TEXT,
    email TEXT,
    role TEXT,
    avatar_url TEXT,
    relationship_type TEXT,
    class_names TEXT[]
) AS $$
DECLARE
    current_user_id UUID := auth.uid();
    current_user_role TEXT;
BEGIN
    -- Get current user's role
    SELECT role INTO current_user_role 
    FROM app_users 
    WHERE id = current_user_id;
    
    IF current_user_role IS NULL THEN
        RAISE EXCEPTION 'User not found or not authenticated';
    END IF;
    
    -- For Teachers: Return students from their classes + other teachers
    IF current_user_role = 'teacher' THEN
        RETURN QUERY
        -- Students in teacher's classes
        SELECT DISTINCT
            au.id,
            au.full_name,
            au.email,
            au.role,
            au.avatar_url,
            'student'::TEXT as relationship_type,
            ARRAY_AGG(DISTINCT c.name) as class_names
        FROM app_users au
        JOIN students s ON s.auth_user_id = au.id OR s.user_id = au.id
        JOIN class_students cs ON cs.student_id = s.id
        JOIN classes c ON c.id = cs.class_id
        WHERE c.user_id = current_user_id
        AND au.id != current_user_id
        AND au.role = 'student'
        GROUP BY au.id, au.full_name, au.email, au.role, au.avatar_url
        
        UNION
        
        -- Other teachers
        SELECT DISTINCT
            au.id,
            au.full_name,
            au.email,
            au.role,
            au.avatar_url,
            'teacher'::TEXT as relationship_type,
            ARRAY[]::TEXT[] as class_names
        FROM app_users au
        WHERE au.role = 'teacher'
        AND au.id != current_user_id;
        
    -- For Students: Return their teachers + students in same classes (if enabled)
    ELSIF current_user_role = 'student' THEN
        RETURN QUERY
        -- Teachers of student's classes
        SELECT DISTINCT
            au.id,
            au.full_name,
            au.email,
            au.role,
            au.avatar_url,
            'teacher'::TEXT as relationship_type,
            ARRAY_AGG(DISTINCT c.name) as class_names
        FROM app_users au
        JOIN classes c ON c.user_id = au.id
        JOIN class_students cs ON cs.class_id = c.id
        JOIN students s ON s.id = cs.student_id
        WHERE (s.auth_user_id = current_user_id OR s.user_id = current_user_id)
        AND au.id != current_user_id
        AND au.role = 'teacher'
        GROUP BY au.id, au.full_name, au.email, au.role, au.avatar_url;
        
        -- Note: Student-to-student chat can be enabled by uncommenting below
        /*
        UNION
        
        -- Other students in same classes
        SELECT DISTINCT
            au.id,
            au.full_name,
            au.email,
            au.role,
            au.avatar_url,
            'classmate'::TEXT as relationship_type,
            ARRAY_AGG(DISTINCT c.name) as class_names
        FROM app_users au
        JOIN students s2 ON s2.auth_user_id = au.id OR s2.user_id = au.id
        JOIN class_students cs2 ON cs2.student_id = s2.id
        JOIN class_students cs1 ON cs1.class_id = cs2.class_id
        JOIN students s1 ON s1.id = cs1.student_id
        JOIN classes c ON c.id = cs2.class_id
        WHERE (s1.auth_user_id = current_user_id OR s1.user_id = current_user_id)
        AND au.id != current_user_id
        AND au.role = 'student'
        GROUP BY au.id, au.full_name, au.email, au.role, au.avatar_url;
        */
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if two users can chat (permission check)
CREATE OR REPLACE FUNCTION can_users_chat(user1_id UUID, user2_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    user1_role TEXT;
    user2_role TEXT;
    shared_classes INT;
BEGIN
    -- Get user roles
    SELECT role INTO user1_role FROM app_users WHERE id = user1_id;
    SELECT role INTO user2_role FROM app_users WHERE id = user2_id;
    
    -- If either user doesn't exist, deny
    IF user1_role IS NULL OR user2_role IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Teachers can chat with other teachers
    IF user1_role = 'teacher' AND user2_role = 'teacher' THEN
        RETURN TRUE;
    END IF;
    
    -- Teacher-Student chat: check if student is in teacher's class
    IF (user1_role = 'teacher' AND user2_role = 'student') THEN
        SELECT COUNT(*) INTO shared_classes
        FROM classes c
        JOIN class_students cs ON cs.class_id = c.id
        JOIN students s ON s.id = cs.student_id
        WHERE c.user_id = user1_id
        AND (s.auth_user_id = user2_id OR s.user_id = user2_id);
        
        RETURN shared_classes > 0;
    END IF;
    
    IF (user1_role = 'student' AND user2_role = 'teacher') THEN
        SELECT COUNT(*) INTO shared_classes
        FROM classes c
        JOIN class_students cs ON cs.class_id = c.id
        JOIN students s ON s.id = cs.student_id
        WHERE c.user_id = user2_id
        AND (s.auth_user_id = user1_id OR s.user_id = user1_id);
        
        RETURN shared_classes > 0;
    END IF;
    
    -- Student-Student chat: check if they share classes (currently disabled)
    -- Uncomment below to enable student-to-student chat
    /*
    IF user1_role = 'student' AND user2_role = 'student' THEN
        SELECT COUNT(*) INTO shared_classes
        FROM class_students cs1
        JOIN students s1 ON s1.id = cs1.student_id
        JOIN class_students cs2 ON cs2.class_id = cs1.class_id
        JOIN students s2 ON s2.id = cs2.student_id
        WHERE (s1.auth_user_id = user1_id OR s1.user_id = user1_id)
        AND (s2.auth_user_id = user2_id OR s2.user_id = user2_id);
        
        RETURN shared_classes > 0;
    END IF;
    */
    
    -- Default deny
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enhanced create_direct_conversation with permission check
CREATE OR REPLACE FUNCTION create_direct_conversation_safe(other_user_id UUID)
RETURNS UUID AS $$
DECLARE
    conversation_id UUID;
    current_user_id UUID := auth.uid();
BEGIN
    -- Check if users can chat
    IF NOT can_users_chat(current_user_id, other_user_id) THEN
        RAISE EXCEPTION 'You do not have permission to chat with this user';
    END IF;
    
    -- Use existing create_direct_conversation function
    SELECT create_direct_conversation(other_user_id) INTO conversation_id;
    
    RETURN conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;