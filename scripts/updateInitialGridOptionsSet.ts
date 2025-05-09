import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

async function updateInitialGridOptions() {
    try {
        // Read the propertyKeys.d.ts file
        const filePath = resolve(
            "node_modules/@ag-grid-community/core/dist/types/src/propertyKeys.d.ts",
        );
        const content = await readFile(filePath, "utf-8");

        // Extract INITIAL_GRID_OPTION_KEYS object using regex
        const match = content.match(/INITIAL_GRID_OPTION_KEYS:\s*{([^}]*)}/);
        if (!match) {
            console.error(
                "Could not find INITIAL_GRID_OPTION_KEYS in the file",
            );
            return;
        }

        // Extract the keys from the object
        const keysString = match[1];
        const keys = keysString
            .split("\n")
            .map((line) => line.trim())
            .filter((line) => line.length > 0)
            .map((line) => line.replace(":", " ").split(" ")[0].trim());

        // Generate the new content for initialGridOptionsSet.ts
        const newContent = `//  A list of grid options to exclude from the update

export default new Set([
    ${keys.map((key) => `"${key}"`).join(",\n    ")}
]);
`;

        // Write the updated content
        await writeFile(
            "src/lib/initialGridOptionsSet.ts",
            newContent,
            "utf-8",
        );
        console.log("Successfully updated initialGridOptionsSet.ts");
    } catch (error) {
        console.error("Error updating initial grid options:", error);
    }
}

updateInitialGridOptions();
