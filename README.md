RentLog - Modular & File-System Based

This version of RentLog has been refactored into a modular structure with separate HTML, CSS, and JavaScript files. The most significant change is the move from browser localStorage to direct interaction with a local data file on your disk using the File System Access API.
Key Changes in This Version

    Local File Storage: The app now asks you to either open an existing rentlog.json data file or create a new one. All changes (adding tenants, editing properties) are saved directly back to this file, giving you full control over your data.

    Modular Codebase:

        index.html: The main application structure.

        /css/style.css: All custom styling.

        /js/app.js: The main application controller that manages state and events.

        /js/ui.js: A dedicated module for all DOM manipulation and rendering.

        /js/fileManager.js: A module that handles all interactions with the File System Access API (opening and saving files).

    Modify Properties: You can now edit the name and address of existing properties.

IMPORTANT: How to Run This Application

Because of browser security restrictions, the File System Access API (which lets this app talk to your local files) will not work if you simply open index.html in your browser. You must serve the files from a local web server.

Here's the easiest way:

    Navigate to the RentLog_Modular directory in your command line or terminal.

    Start a simple web server. If you have Python installed, run this command:

    python -m http.server

    (If you have Python 2, the command is python -m SimpleHTTPServer)

    Open your web browser and go to the address http://localhost:8000.

The application will now load correctly and you will be able to create, open, and save your data file.
