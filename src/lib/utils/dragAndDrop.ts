import type { FileMetadata } from '$lib/types/files';

export interface DragData {
  type: 'file';
  file: FileMetadata;
}

export interface DropTarget {
  type: 'folder';
  folderId: string | null;
  folderName: string;
}

// Drag and drop state management
export function createDragHandlers() {
  let draggedItem: DragData | null = null;
  let isDragging = false;

  function startDrag(file: FileMetadata) {
    draggedItem = { type: 'file', file };
    isDragging = true;
  }

  function endDrag() {
    draggedItem = null;
    isDragging = false;
  }

  function getDraggedItem() {
    return draggedItem;
  }

  function getIsDragging() {
    return isDragging;
  }

  return {
    startDrag,
    endDrag,
    getDraggedItem,
    getIsDragging
  };
}

// HTML5 Drag and Drop handlers
export function createDragEventHandlers(
  file: FileMetadata,
  onDragStart: (file: FileMetadata) => void,
  onDragEnd: () => void
) {
  return {
    draggable: true,
    ondragstart: (e: DragEvent) => {
      if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('application/json', JSON.stringify({
          type: 'file',
          file
        }));
      }
      onDragStart(file);
    },
    ondragend: () => {
      onDragEnd();
    }
  };
}

export function createDropEventHandlers(
  target: DropTarget,
  onDrop: (dragData: DragData, target: DropTarget) => void,
  onDragOver?: (isOver: boolean) => void
) {
  return {
    ondragover: (e: DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = 'move';
      }
      onDragOver?.(true);
    },
    ondragenter: (e: DragEvent) => {
      e.preventDefault();
      onDragOver?.(true);
    },
    ondragleave: (e: DragEvent) => {
      e.preventDefault();
      // Only trigger leave if we're actually leaving the element
      if (!e.currentTarget.contains(e.relatedTarget as Node)) {
        onDragOver?.(false);
      }
    },
    ondrop: (e: DragEvent) => {
      e.preventDefault();
      onDragOver?.(false);
      
      if (e.dataTransfer) {
        try {
          const dragData = JSON.parse(e.dataTransfer.getData('application/json')) as DragData;
          if (dragData.type === 'file') {
            onDrop(dragData, target);
          }
        } catch (error) {
          console.error('Error parsing drag data:', error);
        }
      }
    }
  };
}