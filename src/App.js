import React, { useState } from 'react';
import moment from 'moment'
import MyEditor from './components/MyEditor';
const TextToJsonConverter = () => {
    const [inputText, setInputText] = useState('');
    const [jsonResult, setJsonResult] = useState(null);


    function formatDate(dateStr) {
        // Parse different date formats
        let date = moment(dateStr, ['DD/MM/YYYY', 'DD-MMM-YYYY']);

        if (!date.isValid()) {
            return 'Invalid date';
        }

        return date.format('DDMMYYYY');
    }
    // Function to handle text conversion
    const convertToJson = async () => {
        // Split the input text by new lines
        const lines = inputText.split('\n').filter(line => line.trim() !== '');
        const result = {};


        // Iterate through the lines, processing every two lines as key-value pairs
        for (let i = 0; i < lines.length; i += 2) {
            const key = lines[i].trim(); // Key is on the first line
            const value = lines[i + 1] ? lines[i + 1].trim() : ''; // Value is on the next line
            result[key] = value; // Add to result object
        }

        setJsonResult(result); // Set the result in state
        const date =  formatDate(result['জন্ম তারিখ']) || formatDate(result['Date of Birth'])
        const response = await fetch('http://localhost:3001/modify-pdf', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(
                {
                    clientName: result['একক আবেদনকারী নাম'] || result["Single Applicant Name"] || result["1st Applicant Name"],
                    clientGender: result['লিঙ্গ'] || result['Gender'] ,
                    clientEmail: result['ইমেইল'] || result["Email"],
                    clientDateOfBirth:  date,
                    clientGuardian: result['পিতার / স্বামী / সিইও এর নাম'] || result["Father's/Husband's/CEO's Name"],
                    clientMother: result['মায়ের নাম'] || result["Mother's Name"],
                    boType: result['একক আবেদনকারী নাম'] || result["Single Applicant Name"] ? 'single' : 'joint',
                    clientAddress: result["ঠিকানা"] || result["Address"],
                    clientPostalCode: result["পোস্টাল কোড"] || result["Postal Code"],
                    clientCity: result["শহর"] || result["City"],
                    clientCountry: result["দেশ"] || result["Country"],
                    clientMobileNumber: result["মোবাইল নাম্বার"] || result["Mobile Number"],
                    clientNationality: result["জাতীয়তা"] || result["Nationality"],
                    clientNid: result["জাতীয় আইডি নাম্বার"] || result["National ID Number"],
                    clientOccupation: result["পেশা"] || result["Occupation"],
                }
            )
        })
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        window.open(url, "_blank"); // Open the PDF URL in a new tab or window
    };

    
    return (
        <div>
            <div className='flex flex-col w-2/3 justify-center items-center m-auto mt-[100px] gap-4'>
                <h1 className='text-["orangered"] text-4xl font-bold'>Generate Bo Form</h1>
                <textarea
                    rows="20"
                    cols="70"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Paste your text here"
                    className="rounded-lg border p-2 text-xl"
                />
                <br />
                <button onClick={convertToJson} className='border rounded-sm p-2'>Convert to PDF</button>
            </div>
            <MyEditor />
        </div>
    );
};

export default TextToJsonConverter;
