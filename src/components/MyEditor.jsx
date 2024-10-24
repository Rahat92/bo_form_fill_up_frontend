import React, { useEffect, useState } from 'react';
import { Editor } from '@tinymce/tinymce-react';
import moment from 'moment'

const MyEditor = () => {
    const [inputText, setInputText] = useState('');
    const [content, setContent] = useState('');
    const [jsonResult, setJsonResult] = useState(null);

    const handleEditorChange = (content) => {
        // setContent(content); // Handle content changes
        // console.log(content); // You can see the content with HTML tags in the console
        setInputText(content)
    };

    console.log(inputText)
    function formatDate(dateStr) {
        // Parse different date formats
        let date = moment(dateStr, ['DD/MM/YYYY', 'DD-MMM-YYYY']);

        if (!date.isValid()) {
            return 'Invalid date';
        }

        return date.format('DDMMYYYY');
    }


    function extractDataFromHTML(htmlString) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlString, 'text/html');
        const data = {};

        // Select all <strong> elements (fields) and their subsequent values
        const strongTags = doc.querySelectorAll('p strong');

        strongTags.forEach((strongTag) => {
            const fieldName = strongTag.textContent.trim();
            let fieldValue = '';

            // Get the next element and traverse until the next <br> or <strong>
            let sibling = strongTag.nextSibling;

            while (sibling && (sibling.nodeName !== 'STRONG')) {
                if (sibling.nodeName === 'BR') {
                    sibling = sibling.nextSibling;
                    continue;
                }
                if (sibling.nodeType === Node.TEXT_NODE) {
                    fieldValue += sibling.textContent.trim();
                } else if (sibling.nodeName === 'A') {
                    fieldValue += sibling.href; // Add link if <a> tag is found
                }
                sibling = sibling.nextSibling;
            }

            data[fieldName] = fieldValue;
        });

        return data;
    }

    const convertToJson = async () => {
        
        const result = extractDataFromHTML(inputText)
        console.log(result)
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
                    clientNominyPhoto: result["নমিনির পাসপোর্ট সাইজ ছবিটি আপলোড করুন"] || result["Upload Passport Sized Photo of Nominee"],
                    clientPhoto: result["একক আবেদনকারীর পাসপোর্ট আকারের ছবি আপলোড করুন"] || result["Upload Passport Sized Photograph of Single Applicant"],
                    clientSignature: result["একক আবেদনকারীর স্বাক্ষর আপলোড করুন (স্বাক্ষরটি আপনার এনআইডি কার্ডের সাথে মিলতে হবে)"] || result["Upload Signature of Single Applicant (signature must match your NID card)"],
                }
            )
        })
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        window.open(url, "_blank"); // Open the PDF URL in a new tab or window
    };

    // useEffect(() => {

    // }, [jsonResult])



    return (
        <div className='flex justify-center flex-col items-center mt-8'>
            <Editor
                apiKey="t07rqm8g7iq1q374jkgsazk2vgbmxdowxpa25njpkiwbwj1b"  // Optional, get API key from TinyMCE
                initialValue="<p>Paste your text with links here...</p>"
                init={{
                    height: 500,
                    width: 600,
                    menubar: false,
                    plugins: ['link'],
                    toolbar: 'undo redo | formatselect | bold italic | link | underline',
                }}
                onEditorChange={handleEditorChange}
            />
            <button onClick={convertToJson} className='border rounded-sm p-2'>Convert to PDF</button>
            {/* <div dangerouslySetInnerHTML={{ __html: content }} /> */}
        </div>
    );
};

export default MyEditor;