import React, { useState } from 'react'
import JSZip from 'jszip';

const DownloadZipFile = () => {
    const [status, setStatus] = useState('');

  // Function to download and extract the zip file
  const downloadAndExtractZip = async () => {
    setStatus('Downloading...');
    
    // Fetch the zip file from the server
    const response = await fetch('http://localhost:3000/folder.zip');
    if (!response.ok) {
      setStatus('Download failed');
      return;
    }

    // Get the binary data from the zip file
    const zipData = await response.blob();

    setStatus('Extracting...');
    
    // Create an instance of JSZip
    const zip = new JSZip();

    // Load the zip data into JSZip
    const zipContents = await zip.loadAsync(zipData);

    // Iterate over the zip entries and process them
    const fileEntries = [];
    zipContents.forEach((relativePath, zipEntry) => {
      // Add each file entry to the list
      fileEntries.push(zipEntry);
    });

    setStatus('Extraction successful!');

    // Example: Create download links for the extracted files
    fileEntries.forEach(async (file) => {
      if (!file.dir) {
        const fileData = await file.async('blob');
        const url = URL.createObjectURL(fileData);
        // Create a link to download the extracted file
        const link = document.createElement('a');
        link.href = url;
        link.download = file.name;
        link.textContent = `Download ${file.name}`;
        document.body.appendChild(link);
      }
    });
  };

  return (
    <div>
      <button onClick={downloadAndExtractZip}>Download and Extract ZIP</button>
      <p>{status}</p>
    </div>
  );
}

export default DownloadZipFile