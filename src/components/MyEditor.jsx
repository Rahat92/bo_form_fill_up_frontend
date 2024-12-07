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
    const [typing, setTyping] = useState(false)
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
    const [isDateValid, setIsDateValid] = useState(null)
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
        console.log(content)
        setInputText(content);
        const inputObj = await convertToJson(content)
        // const date = formatDate(inputObj['Date of Birth'])
        setInputObj(inputObj)
    };
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
                    fieldValue += sibling.href;
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
            left: -10,
            right: 10,
        };
        const angle = angleConfig[direction] || 0;
        cropperRefs.current &&
            cropperRefs.current[0] &&
            cropperRefs.current[0].cropper.rotate(angle);
    };

    const convertToJson = async (inputText) => {
        const result = extractDataFromHTML(inputText);
        console.log(result)
        setResults([result])
        return result;
        const croppedSignature = handleGetCroppedImages();
        const resp = await fetch(croppedSignature);
        const blob = await resp.blob();
        const file = new File([blob], "cropped-image.png", { type: "image/jpg" });
        const date = formatDate(result["জন্ম তারিখ"] || result["Date of Birth"]);
        // setLoading(true);
        const formData = new FormData();
        formData.append(
            "clientId",
            clientId
        );
        formData.append(
            "clientName",
            result["একক আবেদনকারী নাম"] ||
            result["Single Applicant Name"] ||
            result["1st Applicant Name"]
        );
        formData.append(
            "clientGender",
            result["লিঙ্গ"] || result["Gender"]
        );
        formData.append(
            "clientEmail",
            result["ইমেইল"] || result["Email"]
        );
        formData.append(
            "clientDateOfBirth",
            date
        );
        formData.append(
            "clientGuardian",
            result["পিতার / স্বামী / সিইও এর নাম"] ||
            result["Father's/Husband's/CEO's Name"]
        );
        formData.append(
            "clientMother",
            result["মায়ের নাম"] || result["Mother's Name"]
        );
        formData.append(
            "boType",
            result["একক আবেদনকারী নাম"] || result["Single Applicant Name"]
                ? "single"
                : "joint"
        );
        formData.append(
            "clientAddress",
            result["ঠিকানা"] || result["Address"]
        );
        formData.append(
            "clientPostalCode",
            result["পোস্টাল কোড"] || result["Postal Code"]
        );
        formData.append(
            "clientCity",
            result["শহর"] || result["City"]
        );
        formData.append(
            "clientCountry",
            result["দেশ"] || result["Country"]
        );
        formData.append(
            "clientMobileNumber",
            result["মোবাইল নাম্বার"] || result["Mobile Number"]
        );
        formData.append(
            "clientNationality",
            result["জাতীয়তা"] || result["Nationality"]
        );
        formData.append(
            "clientNid",
            result["জাতীয় আইডি নাম্বার"] || result["National ID Number"]
        );
        formData.append(
            "clientOccupation",
            result["পেশা"] || result["Occupation"]
        );
        formData.append(
            'clientNominyPhoto',
            result["নমিনির পাসপোর্ট সাইজ ছবিটি আপলোড করুন"] ||
            result["Upload Passport Sized Photo of Nominee"]
        );

        formData.append(
            'clientPhoto',
            result["একক আবেদনকারীর পাসপোর্ট আকারের ছবি আপলোড করুন"] ||
            result["Upload Passport Sized Photograph of Single Applicant"]
        );
        formData.append(
            'clientSignature',
            result[
            "একক আবেদনকারীর স্বাক্ষর আপলোড করুন (স্বাক্ষরটি আপনার এনআইডি কার্ডের সাথে মিলতে হবে)"
            ] ||
            result[
            "Upload Signature of Single Applicant (signature must match your NID card)"
            ]
        );
        formData.append(
            'clientNidPhoto',
            result["একক আবেদনকারীর জন্য জাতীয় আইডি এর ফটোকপি আপলোড করুন"] ||
            result["Upload Photocopy of National ID for Single Applicant"]
        );
        formData.append(
            'jointApplicantName', result["Joint Applicant Name"]
        );
        formData.append(
            'jointApplicantPhoto',
            result["Upload Passport Sized Photograph of Joint Applicant"]
        );
        formData.append(
            'clientBankName',
            result["আপনার ব্যাংকের নাম"] || result["Name of your Bank"]
        );
        formData.append(
            'clientBankDepositeScreenShot',
            result["আপলোড ব্যাংক/বিকাশ/নগদ ডিপোজিট স্লিপ/স্ক্রিনশট"] ||
            result[
            "Upload Bank or (bKash/Rocket/Nagad) Deposit Slip/Screenshot"
            ]
        );
        formData.append(
            'clientBankAccountNumber',
            result["ব্যাংক একাউন্ট নাম্বার"] || result["Bank Account Number"]
        );
        formData.append(
            'clientBankRoutingNumber',
            result["ব্যাংক রাউটিং নম্বর (ঐচ্ছিক)"] ||
            result["Routing Number (Optional)"]
        );
        formData.append(
            'clientDivision', result["বিভাগ"] || result["State/Division"]
        );
        formData.append(
            'jointApplicantSign',
            result[
            "Upload Signature of Joint Applicant (signature must match your NID card)"
            ]
        );
        formData.append('signature', file)
        formData.append('fields', JSON.stringify(result))

        // try {
        //     const { data } = await axios.post(
        //         `http://${process.env.REACT_APP_IP}:3001/modify-pdf?date=${Date.now()}`, formData,
        //         {
        //             headers: {
        //                 "Content-Type": "multipart/form-data",
        //             },
        //         }
        //     );
        //     setServerResponse(data.message);
        //     setLoading(false);
        // } catch (err) {
        //     console.log('my cute error ', err.response?.data?.message)
        //     setServerResponse(err.response?.data?.message);
        //     setLoading(false);
        // }

    };

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
        if (inputText) {
            convertToJson()
        }

    }, [inputText])

    useEffect(() => {
        if (inputText) {
            setTimeout(() => {
                if (results.length > 0 && JSON.stringify(results[0]).length > 150) {

                    const date = formatDate(results[0]["জন্ম তারিখ"] || results[0]["Date of Birth"]);
                    // setLoading(true);
                    if (date === 'Invalid date') {
                        setIsDateValid(false)
                        setWarnings({ ...warnings, dob: 'Invalid Date of Birth.' })
                    } else {
                        setIsDateValid(true)
                        setWarnings({ ...warnings, dob: '' })
                    }

                    // if(results[0]&&results[0]['Date of Birth']?.includes['.']){
                    //     setWarnings(prev => {
                    //         return {
                    //             ...prev,
                    //             dob:'Invalid date of birth. please make this correct.'
                    //         }
                    //     })
                    // }
                }
            }, 1000);
        }
        // return () => {
        //     setWarnings({ dob: '' });
        //     console.log('Hello world')
        // }
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
            });
        }
    }, [clientInfos]);

    useEffect(() => {
        cropperRefs.current = [];
    }, []);


    // const handleEditorChange = (content) => {
    //     setInputText(content);
    // };
    useEffect(() => {
        let timer;
        if (inputText) {
            timer = setTimeout(() => {
                if (inputText.length > 150 && !isDateValid) {
                    setWarnings({...warnings, dob: 'Invalid Date of Birth!!'})
                }
            }, 1000)
        }

        // return () => setWarnings({dob:''})
    }, [inputText])
    useEffect(() => {
        if(warnings.dob.length>10){
            setTimeout(() => {
                setWarnings({dob:''})
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
        <span class="custom-field" contenteditable="true" data-field="middleName">[Enter Middle Name]</span><br>
    `;

    // const handleEditorChange = (content) => {
    //     // Handle editor content changes if needed
    // };

    const handlePaste = () => {
        if (!editorRef.current) return;

        setTimeout(() => {
            const content = editorRef.current.getContent();
            const regex = /(<p><strong>Single Applicant Name<\/strong><br>.*?<br>)(?!.*<strong>First Name<\/strong>)/;

            // Ensure the placeholders are not duplicated
            if (regex.test(content) && !content.includes("First Name")) {
                const updatedContent = content.replace(regex, `$1${additionalFields}`);
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
                    : "[Enter Middle Name]";
            }
        });

        return doc.body.innerHTML;
    };


    useEffect(() => {
        const preloadImages = async () => {
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
            const imgObj = loadedImages.map((imgitem, imgind) => {
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
                                            handlePaste();

                                            // Sanitize placeholders after paste
                                            setTimeout(() => {
                                                const sanitizedContent = sanitizePlaceholders(
                                                    editor.getContent()
                                                );
                                                editor.setContent(sanitizedContent);
                                            }, 0);
                                        });

                                        // Sanitize placeholders on editor load
                                        editor.on("init", () => {
                                            const sanitizedContent = sanitizePlaceholders(editor.getContent());
                                            editor.setContent(sanitizedContent);
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
                                {warnings.dob ? warnings.dob : ''}
                                <div className="flex justify-center gap-4 items-center">
                                    {isDateValid && (
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
                                    }}>Open BO</button>
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
                                                // initialAspectRatio={16 / 9}
                                                initialAspectRatio={300 / 80}
                                                guides={false}
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
