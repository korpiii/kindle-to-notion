import fs from "fs";
import { Client } from '@notionhq/client';
import { text } from "stream/consumers";

// Inicializa la conexión con la API de Notion
const notion = new Client({ auth: process.env.NOTION_KEY });

// ID de la base de datos de Notion
const databaseId = process.env.NOTION_DATABASE_ID


// Define la función para crear un bloque de texto
async function createTextBlock(pageId, text) {
  try {
    const block = {
      object: "block",
      type: "paragraph",
      paragraph: {
        rich_text: [{ text: { content: text } }],
      },
    };
    const { id } = await notion.blocks.children.append({
      block_id: pageId,
      children: [block],
    });
    console.log(`Block created: ${id}`);
  } catch (error) {
    console.error(error);
  }
}

// Lee el archivo y procesa los datos para crear las páginas de Notion
async function processFile() {
  try {
    const fileContents = fs.readFileSync("books.txt", "utf-8");
    const lines = fileContents.split("\n");

    let bookTitle, bookAuthor, bookContent = "";

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (line === "===") {
        // Si se encuentra la línea ===, se crea la página de Notion para el libro anterior
        if (bookTitle && bookAuthor && bookContent) {
          const { id } = await notion.pages.create({
            parent: { database_id: databaseId },
            properties: {
              Title: { title: [{ text: { content: bookTitle } }] },
              Author: { rich_text: [{ text: { content: bookAuthor } }] },
            },
          });
          console.log(`Page created: ${id}`);

          // Crear bloques de texto para cada párrafo del contenido del libro
          const paragraphs = bookContent.split("\n\n");
          for (let i = 0; i < paragraphs.length; i++) {
            await createTextBlock(id, paragraphs[i]);
          }
        }

        // Reiniciar las variables para el siguiente libro
        bookTitle = bookAuthor = bookContent = "";
      } else {
        // Si la línea no es ===, se agregan los datos correspondientes al libro actual
        if (!bookTitle) {
          bookTitle = line;
        } else if (!bookAuthor) {
          bookAuthor = line;
        } else {
          bookContent += line + "\n\n";
        }
      }
    }
  } catch (error) {
    console.error(error);
  }
}

// Ejecuta la función para procesar el archivo y crear las páginas de Notion
processFile();
