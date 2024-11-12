import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion'
import { Editor } from '@tinymce/tinymce-react';
import moment from 'moment'
import logo from './../../src/assets/images/midway-logo-moto.png'
const MyEditor = () => {
    const [inputText, setInputText] = useState('');
    const [windowWidth, setWindowWidth] = useState()
    const [isSubmitButtonClicked, setIsSubmitButtonClicked] = useState()
    const [clientId, setClientId] = useState();
    const [loading, setLoading] = useState(false);
    const [serverResponse, setServerResponse] = useState('')
    useEffect(() => {
        setWindowWidth(window.innerWidth)
        window.addEventListener('resize', () => {
            setWindowWidth(window.innerWidth)
        })
    }, [window.innerWidth])

    const handleEditorChange = (content) => {
        setInputText(content)
    };

    console.log(windowWidth)
    function formatDate(dateStr) {
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
        console.log(doc)
        const strongTags = doc.querySelectorAll('p strong');
        console.log(strongTags)
        strongTags.forEach((strongTag) => {
            const fieldName = strongTag.textContent.trim();
            let fieldValue = '';

            let sibling = strongTag.nextSibling;

            while (sibling && (sibling.nodeName !== 'STRONG')) {
                if (sibling.nodeName === 'BR') {
                    sibling = sibling.nextSibling;
                    continue;
                }
                if (sibling.nodeType === Node.TEXT_NODE) {
                    fieldValue += sibling.textContent.trim();
                } else if (sibling.nodeName === 'A') {
                    fieldValue += sibling.href;
                }
                sibling = sibling.nextSibling;
            }

            data[fieldName] = fieldValue;
        });

        return data;
    }

    const convertToJson = async () => {
        const result = extractDataFromHTML(inputText)
        console.log('haha', Object.keys(result))
        const date = formatDate(result['জন্ম তারিখ']) || formatDate(result['Date of Birth'])
        setLoading(true)
        const response = await fetch(`http://${process.env.REACT_APP_IP}:3001/modify-pdf`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(
                {
                    clientId: clientId,
                    clientName: result['একক আবেদনকারী নাম'] || result["Single Applicant Name"] || result["1st Applicant Name"],
                    clientGender: result['লিঙ্গ'] || result['Gender'],
                    clientEmail: result['ইমেইল'] || result["Email"],
                    clientDateOfBirth: date,
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
                    clientNidPhoto: result["একক আবেদনকারীর জন্য জাতীয় আইডি এর ফটোকপি আপলোড করুন"] || result["Upload Photocopy of National ID for Single Applicant"],
                    jointApplicantName: result["Joint Applicant Name"],
                    jointApplicantPhoto: result["Upload Passport Sized Photograph of Joint Applicant"],
                    clientBankName: result["আপনার ব্যাংকের নাম"] || result["Name of your Bank"],
                    clientBankDepositeScreenShot: result["আপলোড ব্যাংক/বিকাশ/নগদ ডিপোজিট স্লিপ/স্ক্রিনশট"] || result["Upload Bank or (bKash/Rocket/Nagad) Deposit Slip/Screenshot"],
                    clientDivision: result["বিভাগ"] || result["State/Division"],
                    jointApplicantSign: result["Upload Signature of Joint Applicant (signature must match your NID card)"],
                    fields: result
                }
            )
        })
        const res = await response.json()
        setServerResponse(res.message)
        setLoading(false)
        // const blob = await response.blob();
        // const url = window.URL.createObjectURL(blob);
        // window.open(url, "_blank");
    };

    useEffect(() => {
        if (isSubmitButtonClicked) {
            const clientId = prompt('Add client Id.')
            setClientId(clientId)
        }
        return () => setIsSubmitButtonClicked(false)
    }, [isSubmitButtonClicked])
    useEffect(() => {
        if (clientId) {
            convertToJson()
        }
    }, [clientId])
    return (
        <>
            {loading && (
                <div className='fixed top-0 bottom-0 left-0 right-0 z-100 flex justify-center items-center text-2xl'>Generating Folder, Please wait</div>
            )}
            <div className={`${loading?'hidden':'flex'} justify-center flex-col items-center mt-8 gap-8`}>

                <div className='flex flex-col items-center gap-2 h-[15vh]'>
                    <img src={logo} width="60px" />
                    <h1 className='text-3xl font-semibold'>BO form fill up</h1>
                </div>
                <motion.div className=''>
                    <div className='flex flex-col items-center gap-4 h-[85]'>
                        <Editor
                            className=""
                            apiKey="t07rqm8g7iq1q374jkgsazk2vgbmxdowxpa25njpkiwbwj1b"
                            init={{
                                height: windowWidth <= 1600?400:400,
                                width: 500,
                                menubar: false,
                                plugins: ['link'],
                                toolbar: 'undo redo | formatselect | bold italic | link | underline',
                            }}
                            onEditorChange={handleEditorChange}
                            onFocus={() => setServerResponse('')}
                        />
                        <div className='flex flex-col justify-center w-full items-center gap-2'>
                            <div className='text-red-500'>{serverResponse?<p>{serverResponse}</p>:''}</div>
                            {/* <button type='submit' onClick={convertToJson} className='border rounded-sm p-2'>Fill BO form</button> */}
                            <button type='submit' onClick={() => setIsSubmitButtonClicked(true)} className='border rounded-sm p-2'>Fill BO form</button>
                        </div>
                    </div>
                    {/* <div dangerouslySetInnerHTML={{ __html: content }} /> */}
                </motion.div>
            </div>
        </>
    );
};

export default MyEditor;