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

import { motion } from "framer-motion";
import { Editor } from "@tinymce/tinymce-react";
import moment from "moment";
import logo from "./../../src/assets/images/midway-logo-moto.png";
import Cropper from "react-cropper";
import "cropperjs/dist/cropper.css";
import axios from "axios";
const MyEditor = () => {
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
    const imageRef = useRef();
    useEffect(() => {
        setWindowWidth(window.innerWidth);
        window.addEventListener("resize", () => {
            setWindowWidth(window.innerWidth);
        });
    }, [window.innerWidth]);

    const handleEditorChange = (content) => {
        setInputText(content);
    };

    const handleGetCroppedImages = () => {
        let croppedSignature;
        if (cropperRefs.current && cropperRefs.current.length > 0) {
            cropperRefs.current.forEach((cropper, index) => {
                croppedSignature =
                    cropperRefs.current &&
                    cropperRefs.current[index] &&
                    cropperRefs.current[index].cropper.getCroppedCanvas().toDataURL();
            });
        }
        return croppedSignature;
    };
    function formatDate(dateStr) {
        console.log(dateStr)
        let date = moment(dateStr, ["DD/MM/YYYY", "DD-MMM-YYYY"]);
        console.log(date)
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
        console.log(cropperRefs);
        const angleConfig = {
            left: -20,
            right: 20,
        };
        const angle = angleConfig[direction] || 0;
        cropperRefs.current &&
            cropperRefs.current[0] &&
            cropperRefs.current[0].cropper.rotate(angle);
    };

    const convertToJson = async () => {
        const result = extractDataFromHTML(inputText);
        const croppedSignature = handleGetCroppedImages();
        const resp = await fetch(croppedSignature);
        const blob = await resp.blob();
        const file = new File([blob], "cropped-image.png", { type: "image/jpg" });
        console.log(file);
        const date = formatDate(result["জন্ম তারিখ"] || result["Date of Birth"]);
        setLoading(true);
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
        console.log(result)
        const response = await axios.post(
            `http://${process.env.REACT_APP_IP}:3001/modify-pdf?date=${Date.now()}`, formData,
            {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
                // body: formData
                // body: JSON.stringify({
                //   clientId: clientId,
                //   clientName:
                //     result["একক আবেদনকারী নাম"] ||
                //     result["Single Applicant Name"] ||
                //     result["1st Applicant Name"],
                //   clientGender: result["লিঙ্গ"] || result["Gender"],
                //   clientEmail: result["ইমেইল"] || result["Email"],
                //   clientDateOfBirth: date,
                //   clientGuardian:
                //     result["পিতার / স্বামী / সিইও এর নাম"] ||
                //     result["Father's/Husband's/CEO's Name"],
                //   clientMother: result["মায়ের নাম"] || result["Mother's Name"],
                //   boType:
                //     result["একক আবেদনকারী নাম"] || result["Single Applicant Name"]
                //       ? "single"
                //       : "joint",
                //   clientAddress: result["ঠিকানা"] || result["Address"],
                //   clientPostalCode: result["পোস্টাল কোড"] || result["Postal Code"],
                //   clientCity: result["শহর"] || result["City"],
                //   clientCountry: result["দেশ"] || result["Country"],
                //   clientMobileNumber:
                //     result["মোবাইল নাম্বার"] || result["Mobile Number"],
                //   clientNationality: result["জাতীয়তা"] || result["Nationality"],
                //   clientNid:
                //     result["জাতীয় আইডি নাম্বার"] || result["National ID Number"],
                //   clientOccupation: result["পেশা"] || result["Occupation"],
                //   clientNominyPhoto:
                //     result["নমিনির পাসপোর্ট সাইজ ছবিটি আপলোড করুন"] ||
                //     result["Upload Passport Sized Photo of Nominee"],
                //   clientPhoto:
                //     result["একক আবেদনকারীর পাসপোর্ট আকারের ছবি আপলোড করুন"] ||
                //     result["Upload Passport Sized Photograph of Single Applicant"],
                //   clientSignature:
                //     result[
                //       "একক আবেদনকারীর স্বাক্ষর আপলোড করুন (স্বাক্ষরটি আপনার এনআইডি কার্ডের সাথে মিলতে হবে)"
                //     ] ||
                //     result[
                //       "Upload Signature of Single Applicant (signature must match your NID card)"
                //     ],
                //   clientNidPhoto:
                //     result["একক আবেদনকারীর জন্য জাতীয় আইডি এর ফটোকপি আপলোড করুন"] ||
                //     result["Upload Photocopy of National ID for Single Applicant"],
                //   jointApplicantName: result["Joint Applicant Name"],
                //   jointApplicantPhoto:
                //     result["Upload Passport Sized Photograph of Joint Applicant"],

                //   clientBankName:
                //     result["আপনার ব্যাংকের নাম"] || result["Name of your Bank"],
                //   clientBankDepositeScreenShot:
                //     result["আপলোড ব্যাংক/বিকাশ/নগদ ডিপোজিট স্লিপ/স্ক্রিনশট"] ||
                //     result[
                //       "Upload Bank or (bKash/Rocket/Nagad) Deposit Slip/Screenshot"
                //     ],
                //   clientBankAccountNumber:
                //     result["ব্যাংক একাউন্ট নাম্বার"] || result["Bank Account Number"],
                //   clientBankRoutingNumber:
                //     result["ব্যাংক রাউটিং নম্বর (ঐচ্ছিক)"] ||
                //     result["Routing Number (Optional)"],

                //   clientDivision: result["বিভাগ"] || result["State/Division"],
                //   jointApplicantSign:
                //     result[
                //       "Upload Signature of Joint Applicant (signature must match your NID card)"
                //     ],

                //   // clientCroppedSignature: croppedSignature,
                //   fields: result,
                // }),
            }
        );
        const res = response;
        console.log(res)
        setServerResponse(res?.data.message);
        setLoading(false);
        // const blob = await response.blob();
        // const url = window.URL.createObjectURL(blob);
        // window.open(url, "_blank");
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
            convertToJson();
        }
        return setClientId("");
    }, [clientId]);

    console.log(clientInfos);
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
                if(Object.values(clientInfos)[ind].includes('.png') || Object.values(clientInfos)[ind].includes('.jpg') || Object.values(clientInfos)[ind].includes('.jpet')){
                    return true
                }
            })
            console.log(loadedImagesTags)
            const imgObj = loadedImages.map((imgitem, imgind) => {
                return {
                    img: imgitem,
                    tag: loadedImagesTags[imgind]
                }
            })
            // setImages(loadedImages.filter(Boolean)); // Only use successfully loaded images
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
                    <div className="flex flex-col items-center gap-2 h-[15vh]">
                        <img src={logo} width="60px" />
                        <h1 className="text-3xl font-semibold">BO form fill up</h1>
                    </div>
                    <motion.div className="flex gap-24 items-center">
                        <div className="flex flex-col items-center gap-4 h-[85]">
                            <Editor
                                className=""
                                apiKey="t07rqm8g7iq1q374jkgsazk2vgbmxdowxpa25njpkiwbwj1b"
                                init={{
                                    height: windowWidth <= 1600 ? 400 : 400,
                                    width: 500,
                                    menubar: false,
                                    plugins: ["link"],
                                    toolbar:
                                        "undo redo | formatselect | bold italic | link | underline",
                                }}
                                onEditorChange={handleEditorChange}
                                onFocus={() => setServerResponse("")}
                            />
                            <div className="flex flex-col justify-center w-full items-center gap-2">
                                <div className="text-red-500">
                                    {serverResponse ? <p>{serverResponse}</p> : ""}
                                </div>
                                <button
                                    type="submit"
                                    onClick={() => setIsSubmitButtonClicked(true)}
                                    className="border rounded-sm p-2"
                                >
                                    Fill BO form
                                </button>
                            </div>
                        </div>
                        <div className={`${images?.length > 0 ? "flex" : "hidden"} gap-8`}>
                            <div
                                className={`w-[200px] flex flex-col items-center justify-center gap-2`}
                            >
                                {images
                                    .filter((item, index) => {
                                        if(item.tag === 'একক আবেদনকারীর স্বাক্ষর আপলোড করুন (স্বাক্ষরটি আপনার এনআইডি কার্ডের সাথে মিলতে হবে)' || item.tag === 'Upload Signature of Single Applicant (signature must match your NID card)'){
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
                                    {/* <button
                    onClick={handleGetCroppedImages}
                    className="btn-primary"
                    // disabled={isReady.size < images.length} // Disable button if not all are ready
                  >
                    Get Cropped Images
                  </button> */}
                                </>
                            </div>
                        </div>
                        {/* <div dangerouslySetInnerHTML={{ __html: content }} /> */}
                    </motion.div>
                </div>
                {/* <div className='flex gap-8'>
                    <div className='w-[900px] h-[400px] flex flex-wrap gap-2'>
                        {Object.values(documents)
                            .filter((item) => item.endsWith('.png') || item.endsWith('.jpg') || item.endsWith('.jpeg'))
                            .map((src, i) => (
                                <figure key={i} className="flex flex-col items-center gap-2">
                                    <Cropper
                                        src={src}
                                        style={{ height: 200, width: 250 }}
                                        initialAspectRatio={16 / 9}
                                        guides={false}
                                        ref={(el) => (cropperRefs.current[i] = el)}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => handleCropAll(i)}
                                        className="mt-2 border rounded-sm p-1"
                                    >
                                        Crop Image {i + 1}
                                    </button>
                                </figure>
                            ))}
                    </div>
                </div> */}
            </div>
        </>
    );
};

export default MyEditor;
