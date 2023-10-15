const fs = require('fs');
const path = require('path');

const docsDir = path.join(__dirname, 'docs');

fs.readdir(docsDir, (err, files) => {
    if (err) throw err;

    files.forEach(file => {
        if (file.startsWith('index.') && file.endsWith('.js')) {
            const oldPath = path.join(docsDir, file);
            const newPath = path.join(docsDir, 'index.production.js');

            fs.copyFile(oldPath, newPath, (err) => {
                if (err) throw err;
                console.log('Copy complete!');
            });
        }
    });
});
