import MyEditor from './components/MyEditor';
import DownloadZipFile from './components/DownloadZipFile';
import '../src/App.css'
import ReactTooltip from "react-tooltip";
import ImageEditor from './components/ImageEditor/ImageEditor';
const TextToJsonConverter = () => {
    console.log(process.env.REACT_APP_IP)
    console.log('CUSTOM VAR', process.env.REACT_APP_API)
    return (
        <div>
            <MyEditor />

            <ImageEditor />
            <ReactTooltip />
        </div>
    );
};

export default TextToJsonConverter;
