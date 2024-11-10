import MyEditor from './components/MyEditor';
import DownloadZipFile from './components/DownloadZipFile';
import '../src/App.css'
const TextToJsonConverter = () => {
    console.log(process.env.REACT_APP_IP)
    return (
        <div>
            <MyEditor />
        </div>
    );
};

export default TextToJsonConverter;
