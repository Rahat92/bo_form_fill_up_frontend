import React, { useEffect, useRef, useState } from "react";
import {
    BiRotateLeft,
    BiRotateRight,
    BiReset,
    BiDownload,
    BiUpload,
} from "react-icons/bi";
import styles from "./ImageEditor.module.css";
import ControlButton from "./ControlButton.jsx";

import { motion, warning } from "framer-motion";
import { Editor } from "@tinymce/tinymce-react";
import moment from "moment";
import logo from "./../../src/assets/images/midway-logo-moto.png";
import Cropper from "react-cropper";
import "cropperjs/dist/cropper.css";
import axios from "axios";
const MyEditor = () => {
    const [inputObj, setInputObj] = useState({})
    const [validFirstName, setValidFirstName] = useState(true)
    const [validLastName, setValidLastName] = useState(true)
    const [isRoutingNumberValid,setIsRoutingNumberValid] = useState(true)
    const [inputText, setInputText] = useState("");
    const [windowWidth, setWindowWidth] = useState();
    const [isSubmitButtonClicked, setIsSubmitButtonClicked] = useState();
    const [readyState, setReadyState] = useState([]);
    const [clientId, setClientId] = useState();
    const [loading, setLoading] = useState(false);
    const [serverResponse, setServerResponse] = useState("");
    const [clientInfos, setClientInfos] = useState({});
    const [documents, setDocuments] = useState({});
    const cropperRefs = useRef([]); // Use useRef for storing cropper instances
    const [images, setImages] = useState([]);
    const [isReady, setIsReady] = useState(new Set());
    const [warnings, setWarnings] = useState({
        dob: '',
        firstName: '',
        middleName: ''
    })
    const [isDateValid, setIsDateValid] = useState(true)
    const [results, setResults] = useState([])
    useEffect(() => {
        setWindowWidth(window.innerWidth);
        window.addEventListener("resize", () => {
            setWindowWidth(window.innerWidth);
        });
    }, [window.innerWidth]);
    const [renderCount, setRenderCount] = useState(0)
    useEffect(() => {
        setRenderCount(prev => prev + 1)
    }, [])
    const handleEditorChange = async (content) => {
        console.log(content.length)
        if (content.length > 150) {
            setInputText(content);
            const inputObj = await convertToJson(content)
            const date = formatDate(inputObj['জন্ম তারিখ'])!=='Invalid date' || formatDate(inputObj['Date of Birth'])!=='Invalid date'
            console.log(date)
            if (!date) {
                setIsDateValid(false)
            } else {
                setIsDateValid(true)
            }
            setInputObj(inputObj)

            if(inputObj['First Name']==='[Enter First Name]' || inputObj['First Name']?.length === 0){
                // alert('Enter first name')
                setValidFirstName(false)
            }else {
                setValidFirstName(true)
            }
            if(inputObj['Last Name'] === '[Enter Last Name]' || inputObj['Last Name']?.length === 0){
                // alert('Enter middle name')
                setValidLastName(false)
            }else{
                setValidLastName(true)
            }
            console.log(inputObj['Routing Number (Optional)']?.length === 9)
            if(inputObj['Routing Number (Optional)']?.length===9 || inputObj['ব্যাংক রাউটিং নম্বর (ঐচ্ছিক)']?.length===9){
                setIsRoutingNumberValid(true)
            }else{
                setIsRoutingNumberValid(false)
            }
        } else {
            setIsDateValid(true)
        }
    };
    console.log(isRoutingNumberValid)
    const handleGetCroppedImages = () => {
        let croppedSignature;
        if (cropperRefs.current && cropperRefs.current.length > 0) {
            cropperRefs.current.forEach((cropper, index) => {
                croppedSignature =
                    cropperRefs.current &&
                    cropperRefs.current[index] &&
                    cropperRefs.current[index]?.cropper?.getCroppedCanvas()?.toDataURL();
            });
        }
        return croppedSignature;
    };
    function formatDate(dateStr) {
        let date = moment(dateStr, ["DD/MM/YYYY", "DD-MMM-YYYY"]);
        if (!date.isValid()) {
            return "Invalid date";
        }

        return date.format("DDMMYYYY");
    }

    function extractDataFromHTML(htmlString) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlString, "text/html");
        const data = {};
        const strongTags = doc.querySelectorAll("p strong");

        strongTags.forEach((strongTag) => {
            const fieldName = strongTag.textContent.trim();
            let fieldValue = "";

            let sibling = strongTag.nextSibling;

            while (sibling && sibling.nodeName !== "STRONG") {
                if (sibling.nodeName === "BR") {
                    sibling = sibling.nextSibling;
                    continue;
                }
                if (sibling.nodeType === Node.TEXT_NODE) {
                    fieldValue += sibling.textContent.trim();
                } else if (sibling.nodeName === "A") {
                    // Extract only the href value
                    fieldValue += sibling.href.trim();
                } else if (sibling.nodeName === "SPAN" || sibling.nodeName === "DIV") {
                    fieldValue += sibling.textContent.trim();
                }
                sibling = sibling.nextSibling;
            }

            data[fieldName] = fieldValue;
        });

        return data;
    }

    useEffect(() => {
        if (inputText) {
            const infos = extractDataFromHTML(inputText);
            setClientInfos(infos);
        }
    }, [inputText]);

    const onRotate = (direction) => () => {
        const angleConfig = {
            left: -5,
            right: 5,
        };
        const angle = angleConfig[direction] || 0;
        cropperRefs.current &&
            cropperRefs.current[0] &&
            cropperRefs.current[0].cropper.rotate(angle);
    };

    const convertToJson = async (inputText) => {
        const result = extractDataFromHTML(inputText);
        return result;
    };

    useEffect(() => {
        const generateFolder = async () => {
            if (Object.keys(inputObj).length > 10 && clientId.length > 3) {
                const croppedSignature = handleGetCroppedImages();
                const resp = await fetch(croppedSignature);
                const blob = await resp.blob();
                const file = new File([blob], "cropped-image.png", { type: "image/jpg" });
                const date = formatDate(inputObj["জন্ম তারিখ"] || inputObj["Date of Birth"]);
                setLoading(true);
                const formData = new FormData();
                formData.append(
                    "clientId",
                    clientId
                );
                formData.append(
                    "clientName",
                    inputObj["একক আবেদনকারী নাম"] ||
                    inputObj["Single Applicant Name"] ||
                    inputObj["1st Applicant Name"]
                );
                formData.append('firstName', inputObj['First Name'])
                formData.append('middleName', inputObj['Middle Name'] === '[Enter Middle Name]'?'':inputObj['Middle Name'])
                formData.append('lastName', inputObj['Last Name'])
                formData.append(
                    "clientGender",
                    inputObj["লিঙ্গ"] || inputObj["Gender"]
                );
                formData.append(
                    "clientEmail",
                    inputObj["ইমেইল"] || inputObj["Email"]
                );
                formData.append(
                    "clientDateOfBirth",
                    date
                );
                formData.append(
                    "clientGuardian",
                    inputObj["পিতার / স্বামী / সিইও এর নাম"] ||
                    inputObj["Father's/Husband's/CEO's Name"]
                );
                formData.append(
                    "clientMother",
                    inputObj["মায়ের নাম"] || inputObj["Mother's Name"]
                );
                formData.append(
                    "boType",
                    inputObj["একক আবেদনকারী নাম"] || inputObj["Single Applicant Name"]
                        ? "single"
                        : "joint"
                );
                formData.append(
                    "clientAddress",
                    inputObj["ঠিকানা"] || inputObj["Address"]
                );
                formData.append(
                    "clientPostalCode",
                    inputObj["পোস্টাল কোড"] || inputObj["Postal Code"]
                );
                formData.append(
                    "clientCity",
                    inputObj["শহর"] || inputObj["City"]
                );
                formData.append(
                    "clientCountry",
                    inputObj["দেশ"] || inputObj["Country"]
                );
                formData.append(
                    "clientMobileNumber",
                    inputObj["মোবাইল নাম্বার"] || inputObj["Mobile Number"]
                );
                formData.append(
                    "clientNationality",
                    inputObj["জাতীয়তা"] || inputObj["Nationality"]
                );
                formData.append(
                    "clientNid",
                    inputObj["জাতীয় আইডি নাম্বার"] || inputObj["National ID Number"]
                );
                formData.append(
                    "clientOccupation",
                    inputObj["পেশা"] || inputObj["Occupation"]
                );
                formData.append(
                    'clientNominyPhoto',
                    inputObj["নমিনির পাসপোর্ট সাইজ ছবিটি আপলোড করুন"] ||
                    inputObj["Upload Passport Sized Photo of Nominee"]
                );

                formData.append(
                    'clientPhoto',
                    inputObj["একক আবেদনকারীর পাসপোর্ট আকারের ছবি আপলোড করুন"] ||
                    inputObj["Upload Passport Sized Photograph of Single Applicant"]
                );
                formData.append(
                    'clientSignature',
                    inputObj[
                    "একক আবেদনকারীর স্বাক্ষর আপলোড করুন (স্বাক্ষরটি আপনার এনআইডি কার্ডের সাথে মিলতে হবে)"
                    ] ||
                    inputObj[
                    "Upload Signature of Single Applicant (signature must match your NID card)"
                    ]
                );
                formData.append(
                    'clientNidPhoto',
                    inputObj["একক আবেদনকারীর জন্য জাতীয় আইডি এর ফটোকপি আপলোড করুন"] ||
                    inputObj["Upload Photocopy of National ID for Single Applicant"]
                );
                formData.append(
                    'jointApplicantName', inputObj["Joint Applicant Name"]
                );
                formData.append(
                    'jointApplicantPhoto',
                    inputObj["Upload Passport Sized Photograph of Joint Applicant"]
                );
                formData.append(
                    'clientBankName',
                    inputObj["আপনার ব্যাংকের নাম"] || inputObj["Name of your Bank"]
                );
                formData.append(
                    'clientBankDepositeScreenShot',
                    inputObj["আপলোড ব্যাংক/বিকাশ/নগদ ডিপোজিট স্লিপ/স্ক্রিনশট"] ||
                    inputObj[
                    "Upload Bank or (bKash/Rocket/Nagad) Deposit Slip/Screenshot"
                    ] || inputObj['Upload Bank/bKash/Rocket/Nagad Deposit/Screenshot Slip']
                );
                formData.append(
                    'clientBankAccountNumber',
                    inputObj["ব্যাংক একাউন্ট নাম্বার"] || inputObj["Bank Account Number"]
                );
                formData.append(
                    'clientBankRoutingNumber',
                    inputObj["ব্যাংক রাউটিং নম্বর (ঐচ্ছিক)"] ||
                    inputObj["Routing Number (Optional)"]
                );
                formData.append(
                    'clientDivision', inputObj["বিভাগ"] || inputObj["State/Division"]
                );
                formData.append(
                    'jointApplicantSign',
                    inputObj[
                    "Upload Signature of Joint Applicant (signature must match your NID card)"
                    ]
                );
                formData.append(
                    'jointApplicantNidPhoto',
                    inputObj[
                    "Upload Photocopy of National ID for Joint Applicant"
                    ]
                );
                formData.append('signature', file)
                formData.append('fields', JSON.stringify(inputObj))

                try {
                    const { data } = await axios.post(
                        `http://${process.env.REACT_APP_IP}:3001/modify-pdf?date=${Date.now()}`, formData,
                        {
                            headers: {
                                "Content-Type": "multipart/form-data",
                            },
                        }
                    );
                    setServerResponse(data.message);
                    setLoading(false);
                } catch (err) {
                    console.log('my cute error ', err.response?.data?.message)
                    setServerResponse(err.response?.data?.message);
                    setLoading(false);
                }
            }
        }
        generateFolder()
    }, [JSON.stringify(inputObj).length, clientId])

    useEffect(() => {
        if (isSubmitButtonClicked) {
            const clientId = prompt("Add client Id.");
            setClientId(clientId);
        }
        return () => setIsSubmitButtonClicked(false);
    }, [isSubmitButtonClicked]);
    useEffect(() => {
        if (clientId) {
            localStorage.setItem('clientId', clientId)
        }
        return setClientId("");
    }, [clientId]);
    useEffect(() => {
        const convert = async () => {
            if (inputText) {
                console.log(await convertToJson())
            }
        }
        convert()
    }, [inputText])
    console.log(inputObj)
    useEffect(() => {
        if (inputText) {
            setTimeout(() => {
                if (results.length > 0 && JSON.stringify(results[0]).length > 150) {

                    const date = formatDate(results[0]["জন্ম তারিখ"]) || formatDate(results[0]["Date of Birth"]);
                    // setLoading(true);
                    if (date === 'Invalid date') {
                        setIsDateValid(false)
                        setWarnings({ ...warnings, dob: 'Invalid Date of Birth.' })
                    } else {
                        setIsDateValid(true)
                        setWarnings({ ...warnings, dob: '' })
                    }
                }
            }, 1000);
        }

    }, [inputText])
    useEffect(() => {
        if (Object.keys(clientInfos).length > 1) {
            setDocuments({
                clientPhoto1:
                    clientInfos["একক আবেদনকারীর পাসপোর্ট আকারের ছবি আপলোড করুন"] ||
                    clientInfos["Upload Passport Sized Photograph of Single Applicant"],
                clientPhoto2:
                    clientInfos["নমিনির পাসপোর্ট সাইজ ছবিটি আপলোড করুন"] ||
                    clientInfos["Upload Passport Sized Photo of Nominee"],
                clientPhoto3:
                    clientInfos[
                    "একক আবেদনকারীর স্বাক্ষর আপলোড করুন (স্বাক্ষরটি আপনার এনআইডি কার্ডের সাথে মিলতে হবে)"
                    ] ||
                    clientInfos[
                    "Upload Signature of Single Applicant (signature must match your NID card)"
                    ],
                clientPhoto4:
                    clientInfos[
                    "Upload Photocopy of National ID for Joint Applicant"
                    ]
            });
        }
    }, [clientInfos]);

    useEffect(() => {
        cropperRefs.current = [];
    }, []);

    useEffect(() => {
        let timer;
        if (inputText) {
            timer = setTimeout(() => {
                if (inputText.length > 150 && !isDateValid) {
                    setWarnings({ ...warnings, dob: 'Invalid Date of Birth!!' })
                }
            }, 1000)
        }

        // return () => setWarnings({dob:''})
    }, [inputText])
    useEffect(() => {
        if (warnings.dob.length > 10) {
            setTimeout(() => {
                setWarnings({ dob: '' })
            }, 1000);
        }
    }, [warnings.dob.length])

    const editorRef = useRef(null);

    const additionalFields = `
        <br><br>
        <strong>First Name</strong><br>
        <span class="custom-field" contenteditable="true" data-field="firstName">[Enter First Name]</span><br><br>
        <br>
        <strong>Middle Name</strong><br>
        <span class="custom-field" contenteditable="true" data-field="middleName">[Enter Middle Name]</span><br><br>

        <br>
        <strong>Last Name</strong><br>
        <span class="custom-field" contenteditable="true" data-field="lastName">[Enter Last Name]</span><br>
    `;

    const additionalFieldsForJoint = `
        <br><br>
        <strong>Joint First Name</strong><br>
        <span class="joint-custom-field" contenteditable="true" data-field="joint-firstName">[Enter Joint First Name]</span><br><br>
        <br>
        <strong>Joint Middle Name</strong><br>
        <span class="joint-custom-field" contenteditable="true" data-field="joint-middleName">[Enter Joint Middle Name]</span><br><br>

        <br>
        <strong>Joint Last Name</strong><br>
        <span class="joint-custom-field" contenteditable="true" data-field="joint-lastName">[Enter Joint Last Name]</span><br>
    `;

    const handlePasteClint = () => {
        if (!editorRef.current) return;

        setTimeout(() => {
            const content = editorRef.current.getContent();
            let regex;
            if (content.includes('একক আবেদনকারী নাম')) {
                regex = /(<p><strong>একক আবেদনকারী নাম<\/strong><br>.*?<br>)(?!.*<strong>First Name<\/strong>)/;
            } else if(content.includes('Single Applicant Name')) {
                regex = /(<p><strong>Single Applicant Name<\/strong><br>.*?<br>)(?!.*<strong>First Name<\/strong>)/
            } else if(content.includes('1st Applicant Name')){
                regex = /(<p><strong>1st Applicant Name<\/strong><br>.*?<br>)(?!.*<strong>First Name<\/strong>)/
            }

            // Ensure the placeholders are not duplicated
            if (regex?.test(content) && !content.includes("First Name")) {
                const updatedContent = content.replace(regex, `$1${additionalFields}`);
                editorRef.current.setContent(updatedContent);
            }
        }, 0);
    };

    const handlePasteJoint = () => {

        if (!editorRef.current) return;
        setTimeout(() => {
            const content = editorRef.current.getContent();
            let regex;
            if (content.includes('Joint Applicant Name')) {
                regex = /(<p><strong>Joint Applicant Name<\/strong><br>.*?<br>)(?!.*<strong>Joint First Name<\/strong>)/;
            }

            // Ensure the placeholders are not duplicated
            if (regex?.test(content) && !content.includes("Joint First Name")) {
                const updatedContent = content.replace(regex, `$1${additionalFieldsForJoint}`);
                editorRef.current.setContent(updatedContent);
            }
        }, 0);
    };

    const sanitizePlaceholders = (content) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(content, "text/html");
        const fields = doc.querySelectorAll(".custom-field");

        fields.forEach((field) => {
            if (field.textContent.trim() === "") {
                field.textContent = field.dataset.field === "firstName"
                    ? "[Enter First Name]"
                    :field.textContent = field.dataset.field === "middleName"? "[Enter Middle Name]":"[Enter Last Name]";
            }
        });

        return doc.body.innerHTML;
    };
    const sanitizePlaceholdersForJoint = (content) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(content, "text/html");
        const fields = doc.querySelectorAll(".joint-custom-field");

        fields.forEach((field) => {
            if (field.textContent.trim() === "") {
                field.textContent = field.dataset.field === "joint-firstName"
                    ? "[Enter Joint First Name]"
                    :field.textContent = field.dataset.field === "joint-middleName"? "[Enter Joint Middle Name]":"[Enter Joint Last Name]";
            }
        });

        return doc.body.innerHTML;
    };


    useEffect(() => {
        const preloadImages = async () => {
            console.log(Object.values(clientInfos))
            const loadedImages = await Promise.all(
                Object.values(clientInfos)
                    .filter(
                        (src) =>
                            src.includes("png") || src.includes("jpg") || src.includes("jpeg")
                    )
                    .map(
                        (src) =>
                            new Promise((resolve) => {
                                const img = new Image();
                                let str = src;
                                console.log(str)
                                const regex = /\(([^)]+)\)/g;
                                const matches = [...str.matchAll(regex)];
                                const results = matches.map(match => match[1]);
                                console.log(results[0])
                                img.src = src;
                                img.onload = () => resolve(src);
                                img.onerror = () => resolve(null); // Skip broken images
                            })
                    )
            );
            const loadedImagesTags = Object.keys(clientInfos).filter((item, ind) => {
                if (Object.values(clientInfos)[ind].includes('.png') || Object.values(clientInfos)[ind].includes('.jpg') || Object.values(clientInfos)[ind].includes('.jpeg')) {
                    return true
                }
            })
            console.log(loadedImages)
            const imgObj = loadedImages.map((imgitem, imgind) => {
                let str = imgitem;
                const regex = /\(([^)]+)\)/g;
                const matches = [...str.matchAll(regex)];
                const results = matches.map(match => match[1]);

                return {
                    img: imgitem,
                    tag: loadedImagesTags[imgind]
                }
            })
            setImages(imgObj); // Only use successfully loaded images
        };

        preloadImages();
    }, [clientInfos]);
    useEffect(() => {
        if (cropperRefs.current.length === images.length) {
            const allReady = cropperRefs.current.every(
                (cropper) => cropper && cropper.getCroppedCanvas
            );
            if (allReady) {
                setIsReady(new Set([...Array(images.length).keys()])); // Mark all as ready
            } else {
                console.log("Not all cropper instances are ready yet.");
            }
        }
    }, [images]);
    return (
        <>
            {loading && (
                <div className="fixed top-0 bottom-0 left-0 right-0 z-100 flex justify-center items-center text-2xl">
                    Generating Folder, Please wait...
                </div>
            )}
            <div
                className={`${loading ? "hidden" : "flex"
                    } justify-center flex-row items-center mt-8 gap-24`}
            >
                <div>
                    <div className="flex flex-col items-center gap-2 h-[16vh]">
                        <img src={logo} width="40px" />
                        <h1 className="text-2xl font-semibold">BO form fill up</h1>
                    </div>
                    <motion.div className="flex gap-24 items-center">
                        <div className="flex flex-col items-center gap-4 h-[85]">
                            <Editor
                                className=""
                                apiKey="t07rqm8g7iq1q374jkgsazk2vgbmxdowxpa25njpkiwbwj1b"
                                init={{
                                    height: 400,
                                    width: 500,
                                    menubar: false,
                                    plugins: ["link"],
                                    toolbar: "undo redo | formatselect | bold italic | link | underline",
                                    extended_valid_elements: "span[class|contenteditable|data-field]",
                                    setup: (editor) => {
                                        editorRef.current = editor;

                                        // Add paste event listener
                                        editor.on("paste", () => {
                                            handlePasteClint();
                                            handlePasteJoint();
                                            // Sanitize placeholders after paste
                                            setTimeout(() => {
                                                const sanitizedContent = sanitizePlaceholders(
                                                    editor.getContent()
                                                );
                                                editor.setContent(sanitizedContent);

                                                const sanitizedContentForJoint = sanitizePlaceholdersForJoint(
                                                    editor.getContent()
                                                );
                                                editor.setContent(sanitizedContentForJoint);
                                            }, 0);
                                        });

                                        // Sanitize placeholders on editor load
                                        editor.on("init", () => {
                                            const sanitizedContent = sanitizePlaceholders(editor.getContent());
                                            editor.setContent(sanitizedContent);

                                            const sanitizedContentForJoint = sanitizePlaceholdersForJoint(editor.getContent());
                                            editor.setContent(sanitizedContentForJoint);
                                        });
                                    },
                                }}
                                onEditorChange={handleEditorChange}
                                onFocus={() => setServerResponse("")}
                                onKeyPress={() => {
                                    // handleEditorChange(inputText)
                                }}
                            // onMouseUp={() => {
                            //     console.log('Hello Bangladesh')
                            // }}
                            />
                            {/* <div
                                dangerouslySetInnerHTML={{
                                    __html: editorContent,
                                }}
                            ></div> */}
                            <div className="flex flex-col justify-center w-full items-center gap-2">
                                <div className="text-red-500">
                                    {serverResponse?.length > 0 ? <p>{serverResponse}</p> : ""}
                                </div>
                                <span className="font-bold text-red-500">{!isDateValid && inputText?.length>150 ? 'Invalid date format!' : ''}</span>
                                <span className="font-bold text-red-500">{!validFirstName && inputText?.length>150 ? 'First name is required!' : ''}</span>
                                <span className="font-bold text-red-500">{!validLastName && inputText?.length>150 ? 'Last name is required!' : ''}</span>
                                <span className="font-bold text-red-500">{!isRoutingNumberValid && inputText?.length>150 ? 'Routing number is required!' : ''}</span>
                                <div className="flex justify-center gap-4 items-center">
                                    {isDateValid && validFirstName && validLastName && isRoutingNumberValid && inputText?.length>150 && (
                                        <button
                                            disabled={warnings.dob.length > 0 ? true : false}
                                            type="submit"
                                            onClick={() => setIsSubmitButtonClicked(true)}
                                            className="border rounded-sm p-2"
                                        >
                                            Fill BO form
                                        </button>
                                    )}
                                    <button className="border rounded-sm p-2" onClick={async () => {
                                        const folderName = localStorage.getItem('clientId')
                                        await axios.get(`http://${process.env.REACT_APP_IP}:3001/open-folder/${folderName}`)
                                    }}>Open</button>
                                </div>
                            </div>
                        </div>
                        <div className={`${images?.length > 0 ? "flex" : "hidden"} gap-8`}>
                            <div
                                className={`w-[200px] flex flex-col items-center justify-center gap-2`}
                            >
                                {images
                                    .filter((item, index) => {
                                        if (item.tag === 'Upload Signature of Single Applicant (signature must match your NID card)' || item.tag === 'একক আবেদনকারীর স্বাক্ষর আপলোড করুন (স্বাক্ষরটি আপনার এনআইডি কার্ডের সাথে মিলতে হবে)') {
                                            return true
                                        }
                                    })
                                    .map((finalItem, index) => (
                                        <div key={index} className="cropper-container">
                                            <Cropper
                                                src={finalItem.img}
                                                style={{ height: 200, width: 250 }}
                                                initialAspectRatio={300 / 80}
                                                guides={true}
                                                ref={(cropper) => {
                                                    if (cropper && !isReady.has(index)) {
                                                        cropperRefs.current[index] = cropper;
                                                        // Mark this cropper as ready
                                                        setIsReady((prev) => new Set(prev).add(index));
                                                    }
                                                }}
                                            />
                                            <div className={styles.controlsBlock}>
                                                <ControlButton
                                                    tooltip="Rotate Left"
                                                    onClick={onRotate("left")}
                                                >
                                                    <BiRotateLeft size={30} />
                                                </ControlButton>
                                                <ControlButton
                                                    tooltip="Rotate Right"
                                                    onClick={onRotate("right")}
                                                >
                                                    <BiRotateRight size={30} />
                                                </ControlButton>
                                            </div>
                                        </div>
                                    ))}
                                <>
                                    <p className="text-2xl">
                                        <b>Client Signature</b>
                                    </p>
                                </>
                            </div>
                        </div>
                        {/* <div dangerouslySetInnerHTML={{ __html: content }} /> */}
                    </motion.div>
                </div>
            </div>
        </>
    );
};

export default MyEditor;
