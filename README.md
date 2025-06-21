# MongoDB Video URL Update Scripts

This project contains a set of Node.js scripts designed to update video URLs for multilingual content in a MongoDB database. The primary script, `updateVideosBySlug.js`, allows you to update video links for 16 different languages for a specific document identified by its slug.

## Project Setup

1.  **Prerequisites**: Make sure you have [Node.js](https://nodejs.org/) installed on your system (version 18.x or higher is recommended).

2.  **Install Dependencies**: Open your terminal in the project directory and run the following command to install the required MongoDB driver:

    ```bash
    npm install mongodb
    ```

## How to Update Video URLs

The main script for updating video URLs is `updateVideosBySlug.js`. It takes a document's slug and a series of video URLs as command-line arguments.

### Command Syntax

```bash
node updateVideosBySlug.js <slug> [<url_1> <url_2> ... <url_16>]
```

-   `<slug>`: **Required**. The slug of the document you want to update (e.g., `aif.json`).
-   `<url_1> ... <url_16>`: **Optional**. The video URLs for each language. You must provide them in the correct order. If you don't want to update a specific language, use an empty string `""` as a placeholder.

### Language Order

It is crucial to provide the video URLs in the following order. The script maps the URLs to the languages based on this sequence:

1.  `en` (English)
2.  `hi` (Hindi)
3.  `te` (Telugu)
4.  `as` (Assamese)
5.  `kok` (Konkani)
6.  `gu` (Gujarati)
7.  `ml` (Malayalam)
8.  `mr` (Marathi)
9.  `mni` (Manipuri)
10. `lus` (Lushai/Mizo)
11. `or` (Odia)
12. `pa` (Punjabi)
13. `ta` (Tamil)
14. `bn` (Bengali)
15. `ks` (Kashmiri)
16. `kn` (Kannada)

### Example Commands

**1. Update all 16 languages for a specific slug:**

```bash
node updateVideosBySlug.js aif.json "https://example.com/en.mp4" "https://example.com/hi.mp4" "https://example.com/te.mp4" "https://example.com/as.mp4" "https://example.com/kok.mp4" "https://example.com/gu.mp4" "https://example.com/ml.mp4" "https://example.com/mr.mp4" "https://example.com/mni.mp4" "https://example.com/lus.mp4" "https://example.com/or.mp4" "https://example.com/pa.mp4" "https://example.com/ta.mp4" "https://example.com/bn.mp4" "https://example.com/ks.mp4" "https://example.com/kn.mp4"
```

**2. Update only a few specific languages (e.g., Hindi, Tamil, and Odia):**

```bash
node updateVideosBySlug.js aif.json "" "https://example.com/hi.mp4" "" "" "" "" "" "" "" "" "https://example.com/or.mp4" "" "https://example.com/ta.mp4" "" "" ""
```

## Utility Scripts

This project also includes several utility scripts to help with debugging and verification:

-   `listAllSlugs.js`: Lists all documents with their `_id`, `state`, and `slug` to help you identify which document to update.
-   `getDocumentBySlug.js`: Fetches and displays the full document details for a given slug.
-   `getIdBySlug.js`: Retrieves the document ID for a given slug, highlighting the target ID `775a846c8c5442458ea4860111b28c57` if found.
-   `updateById.js`: Updates a document using its specific MongoDB `_id`. This is useful when multiple documents share the same slug.

