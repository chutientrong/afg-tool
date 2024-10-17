import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

// Utility function to create a file with content
function createFileWithContent(
  folderPath: string,
  fileName: string,
  content: string
) {
  const filePath = path.join(folderPath, fileName);
  fs.writeFileSync(filePath, content.trim(), "utf8");
}

function formatString(input: string, isUpperCase: boolean = false): string {
  // Split the string by hyphens or special characters
  const splitString = input.split(/[^a-zA-Z0-9]+/);

  // Capitalize the first letter of each segment
  const formattedString = splitString
    .map(
      (segment) =>
        segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase()
    )
    .join("");

  // Return the formatted string in uppercase if isUpperCase is true
  return isUpperCase ? formattedString.toUpperCase() : formattedString;
}

// Function to show a quick pick menu for generating files
async function showGenerateMenu(selectedFolderPath: string) {
  const options = [
    {
      label: "Generate Services Module",
      command: "autoFGTool.generateServicesModule",
    },
    {
      label: "Generate Default File",
      command: "autoFGTool.generateDefaultFile",
    },
    {
      label: "Generate Queries File",
      command: "autoFGTool.generateQueriesFile",
    },
    {
      label: "Generate Services File",
      command: "autoFGTool.generateServicesFile",
    },
    { label: "Generate Types File", command: "autoFGTool.generateTypesFile" },
    { label: "Generate Model File", command: "autoFGTool.generateModelFile" },
  ];

  const selectedOption = await vscode.window.showQuickPick(
    options.map((option) => option.label),
    { placeHolder: "Select an option" }
  );

  const commandToExecute = options.find(
    (option) => option.label === selectedOption
  )?.command;

  if (commandToExecute) {
    vscode.commands.executeCommand(
      commandToExecute,
      vscode.Uri.file(selectedFolderPath)
    );
  }
}

const getContent = (
  type: "default" | "queries" | "services" | "types" | "model",
  fileName: string
) => {
  switch (type) {
    case "default":
      return `
import { I${formatString(fileName)}sRequest } from "./${fileName}.types";

export const  ${formatString(fileName, true)}_PARAMS = {
	default: () => ({ page: 0, perPage: 20 }),
	list: (params?:  I${formatString(fileName)}sRequest) => ({
		... ${formatString(fileName, true)}_PARAMS.default(),
		...params,
	}),
};

const getListSearchQuery = (params:  I${formatString(fileName)}sRequest) =>
	!params?.fullTextSearch
	? ([... ${formatString(
    fileName,
    true
  )}_KEYS.list(), params.page, params.perPage] as const)
	: ([
		... ${formatString(fileName, true)}_KEYS.list(),
		params.page,
		params.perPage,
		params.fullTextSearch,
	] as const);

export const  ${formatString(fileName, true)}_KEYS = {
	all: () => ["${fileName}s"] as const,
	list: () => [... ${formatString(fileName, true)}_KEYS.all(), "list"],
	listSearch: (params:  I${formatString(
    fileName
  )}sRequest) => getListSearchQuery(params),
};
`;
    case "queries":
      return `
import { I${formatString(fileName)} } from "@/models/${fileName}";
import { useQuery } from "@tanstack/react-query";
import { IBaseResponse } from "../common.type";
import { ${formatString(fileName, true)}_KEYS } from "./${fileName}.default";
import { get${formatString(fileName)}sList } from "./${fileName}.services";
import { I${formatString(fileName)}sRequest } from "./${fileName}.types";

export const use${formatString(fileName)}sList = (
	params: I${formatString(fileName)}sRequest,
	initData?: IBaseResponse<I${formatString(fileName)}>
	) => {
	return useQuery({
		queryKey: ${formatString(fileName, true)}_KEYS.listSearch(params),
		queryFn: () => get${formatString(fileName)}sList(params),
		select(data) {
			const content = data.content.map((item, index) => ({
				...item,
				index: index + 1,
			}));
			return { ...data, content };
		},
		initialData: initData,
		staleTime: 10 * 1000,
		retry: false,
	});
};
`;
    case "services":
      return `
import { I${formatString(fileName)} } from "@/models/${fileName}";
import api from "../api";
import { initParamsRequest } from "../common.init";
import { IBaseResponse } from "../common.type";
import { I${formatString(fileName)}sRequest } from "./${fileName}.types";

export const get${formatString(fileName)}sList = (
	params?: I${formatString(fileName)}sRequest
	): Promise<IBaseResponse<I${formatString(fileName)}>> => {
		return api
			.get<IBaseResponse<I${formatString(fileName)}>>("/api/v1/admin/${fileName}", {
				params: { ...initParamsRequest, ...params },
			})
			.then((res) => {
				return res.data;
	});
};
`;
    case "types":
      return `
import { IParamsRequest } from "../common.type"; // common type

export interface I${formatString(fileName)}sRequest extends IParamsRequest {}
`;
    case "model":
      return `
export interface I${formatString(fileName)} {
  id: number;
}
`;
    default:
      return "";
  }
};

export function activate(context: vscode.ExtensionContext) {
  console.log('Your extension "create-new-folder" is now active!');

  // Create New Folder command
  let createNewFolder = vscode.commands.registerCommand(
    "autoFGTool.createNewFolder",
    async (uri: vscode.Uri) => {
      const selectedFolderPath = uri.fsPath;
      await showGenerateMenu(selectedFolderPath);
    }
  );

  // Generate all services (folder + files)
  let generateServicesModule = vscode.commands.registerCommand(
    "autoFGTool.generateServicesModule",
    async (uri: vscode.Uri) => {
      // Prompt the user to enter the folder name
      const folderName = await vscode.window.showInputBox({
        prompt: "Enter the folder name",
        placeHolder: 'Enter folder name, e.g. "todo"',
      });

      if (!folderName) {
        vscode.window.showWarningMessage("Folder name cannot be empty.");
        return;
      }

      const selectedFolderPath = uri.fsPath;
      const newFolderPath = path.join(selectedFolderPath, folderName);

      // Check if folder already exists
      if (fs.existsSync(newFolderPath)) {
        vscode.window.showErrorMessage(
          `Folder "${folderName}" already exists.`
        );
        return;
      }

      // Create the folder
      fs.mkdirSync(newFolderPath);
      vscode.window.showInformationMessage(
        `Folder "${folderName}" created successfully!`
      );
      // Files to be created
      const filesToCreate = [
        "default.ts",
        "queries.ts",
        "services.ts",
        "types.ts",
      ];
      // Create all files inside the new folder

      filesToCreate.forEach((file) => {
        const filePath = `${folderName}.${file}`;

        // Add content to the "todo.default.ts" file
        let fileContent = "";
        switch (file) {
          case "default.ts":
            fileContent = getContent("default", folderName);
            break;
          case "queries.ts":
            fileContent = getContent("queries", folderName);
            break;
          case "services.ts":
            fileContent = getContent("services", folderName);
            break;
          case "types.ts":
            fileContent = getContent("types", folderName);
            break;
          default:
            break;
        }
        createFileWithContent(newFolderPath, filePath, fileContent);
      });

      vscode.window.showInformationMessage(
        `All files generated in "${folderName}" folder.`
      );
    }
  );

  // Generate default file
  let generateDefaultFile = vscode.commands.registerCommand(
    "autoFGTool.generateDefaultFile",
    (uri: vscode.Uri) => {
      const folderPath = uri.fsPath;
      const folderName = path.basename(folderPath); // Get the name of the selected folder

      createFileWithContent(
        folderPath,
        `${folderName}.default.ts`,
        getContent("default", folderName)
      );
      vscode.window.showInformationMessage(
        `Generated default file in "${folderPath}".`
      );
    }
  );

  // Generate queries file
  let generateQueriesFile = vscode.commands.registerCommand(
    "autoFGTool.generateQueriesFile",
    (uri: vscode.Uri) => {
      const folderPath = uri.fsPath;
      const folderName = path.basename(folderPath); // Get the name of the selected folder

      createFileWithContent(
        folderPath,
        `${folderName}.queries.ts`,
        getContent("queries", folderName)
      );
      vscode.window.showInformationMessage(
        `Generated queries file in "${folderPath}".`
      );
    }
  );

  // Generate services file
  let generateServicesFile = vscode.commands.registerCommand(
    "autoFGTool.generateServicesFile",
    (uri: vscode.Uri) => {
      const folderPath = uri.fsPath;
      const folderName = path.basename(folderPath); // Get the name of the selected folder

      createFileWithContent(
        folderPath,
        `${folderName}.services.ts`,
        getContent("services", folderName)
      );
      vscode.window.showInformationMessage(
        `Generated services file in "${folderPath}".`
      );
    }
  );

  // Generate types file
  let generateTypesFile = vscode.commands.registerCommand(
    "autoFGTool.generateTypesFile",
    (uri: vscode.Uri) => {
      const folderPath = uri.fsPath;
      const folderName = path.basename(folderPath); // Get the name of the selected folder

      createFileWithContent(
        folderPath,
        `${folderName}.types.ts`,
        getContent("types", folderName)
      );
      vscode.window.showInformationMessage(
        `Generated types file in "${folderPath}".`
      );
    }
  );
  // Generate Model file
  //     let generateModelFile = vscode.commands.registerCommand('autoFGTool.generateModelFile', (uri: vscode.Uri) => {

  //         const folderPath = uri.fsPath;
  // 		const folderName = path.basename(folderPath); // Get the name of the selected folder

  //         fs.writeFileSync(path.join(folderPath, `${folderName}.model.ts`), `
  // export interface I${formatString(folderName)} {
  //   id: number;
  // }
  // 		`, 'utf8');
  //         vscode.window.showInformationMessage(`Generated Model file in "${folderPath}".`);
  //     });
  let generateModelFile = vscode.commands.registerCommand(
    "autoFGTool.generateModelFile",
    async (resourceUri: vscode.Uri) => {
      // Step 1: Ask for user input for the file name
      const fileName = await vscode.window.showInputBox({
        prompt: "Enter the name of the file you want to create",
        placeHolder: "todo",
      });

      // Step 2: Validate user input
      if (!fileName) {
        vscode.window.showErrorMessage("File name is invalid.");
        return;
      }

      // Step 3: Get the selected folder URI
      if (!resourceUri || !fs.lstatSync(resourceUri.fsPath).isDirectory()) {
        vscode.window.showErrorMessage("No valid folder selected.");
        return;
      }

      const folderPath = resourceUri.fsPath;
      const filePath = path.join(folderPath, fileName);

      // Step 4: Create the file in the selected folder
      try {
        if (fs.existsSync(filePath)) {
          vscode.window.showErrorMessage(
            `File ${fileName} already exists in the selected folder.`
          );
          return;
        }

        // Create the file with empty content
        createFileWithContent(
          folderPath,
          `${fileName}.model.ts`,
          getContent("model", fileName)
        );
        vscode.window.showInformationMessage(
          `File ${fileName} created successfully in ${folderPath}!`
        );
      } catch (error: any) {
        vscode.window.showErrorMessage(
          `Error creating file: ${error?.message}`
        );
      }
    }
  );
  context.subscriptions.push(
    createNewFolder,
    generateServicesModule,
    generateDefaultFile,
    generateQueriesFile,
    generateServicesFile,
    generateTypesFile,
    generateModelFile
  );
}

export function deactivate() {}
