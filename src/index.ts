#! /usr/bin/env node

const { Command } = require("commander");
// imports
const fs = require("fs");
const path = require("path");
const figlet = require("figlet");

const program = new Command();

// figlet
console.log(figlet.textSync("DirNode", { horizontalLayout: "full" }))

// options
program
    .version("1.0.0")
    .description("A Command Line Interface for directories management written in TypeScript")
    .option("-l, --list [value]", "List directory contents")
    .option("-m, --mkdir [value]", "Create a new directory")
    .option("-t, --touch [value]", "Create a new file")
    .parse(process.argv);

const options = program.opts();

// List directory contents
async function listDirContents(filepath: string) {
    try {
        // read the directory
        const files = await fs.promises.readdir(filepath);
        const detailedFilesPromises = files.map(async (file: string) => {
            const fileDetails = await fs.promises.lstat(path.resolve(filepath, file));
            if (fileDetails.isDirectory()) {
                // if its a directory, gets its size
                const dirSize = await getDirSize(path.resolve(filepath, file));
                return { filename: file, size: formatFileSize(dirSize), created_at: fileDetails.birthtime };
            } else {
                // if its a file, just get its size
                return { filename: file, size: formatFileSize(fileDetails.size), created_at: fileDetails.birthtime };
            }
        });
        // display the data
        const detailedFiles = await Promise.all(detailedFilesPromises);
        console.table(detailedFiles);
    } catch (error) {
        console.error("Error listing directory contents:", error);
    }
}

// Create a new directory
function createDir(filepath: string) {
    if (!fs.existsSync(filepath)) {
        fs.mkdirSync(filepath);
        console.log("The directory has been created successfully!");
    }
}

// Create a new file
function createFile(filepath: string) {
    fs.openSync(filepath, "w");
    console.log("An empty file has been created successfully!");
}

// Format of the file sizes
function formatFileSize(size: number): string {
    if (size < 1024) {
        return `${size} bytes`;
    } else if (size < 1024 * 1024) {
        return `${(size / 1024).toFixed(2)} KB`;
    } else if (size < 1024 * 1024 * 1024) {
        return `${(size / (1024 * 1024)).toFixed(2)} MB`;
    } else {
        return `${(size / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    }
}

// Helper function to get the total size of a directory
async function getDirSize(dirpath: string): Promise<number> {
    const files = await fs.promises.readdir(dirpath);
    let totalSize = 0;
    for (const file of files) {
        const filepath = path.resolve(dirpath, file);
        const fileDetails = await fs.promises.lstat(filepath);
        if (fileDetails.isDirectory()) {
            // if it's a directory, recursively gets its size
            totalSize += await getDirSize(filepath);
        } else {
            // if its a file, just add its size
            totalSize += fileDetails.size;
        }
    }
    return totalSize;
}

// ### Check the option which is selected ###

// List directory option, -l or --list:
if (options.list) {
    const filepath = typeof options.list === "string" ? options.list : process.cwd();
    listDirContents(filepath);
}

// Create directory option, -m or --makedir:
if (options.mkdir) {
    createDir(path.resolve(process.cwd(), options.mkdir))
}

// Create file option, -t or --touch:
if (options.touch) {
    createFile(path.resolve(process.cwd(), options.touch))
}

// Show the Help page if no options has been chosen
if (!process.argv.slice(2).length) {
    program.outputHelp();
}