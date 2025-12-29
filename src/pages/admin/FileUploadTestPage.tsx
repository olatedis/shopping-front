import { useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";

export default function UploadImage() {
    const [fileName, setFileName] = useState("");

    const handleUpload = async (e) => {
        const file = e.target.files[0];
        const formData = new FormData();
        formData.append("file", file);

        try {
            const token = localStorage.getItem("logIn");
            const resp = await axios.post("http://localhost:8080/api/upload", formData, {
                headers: { "Content-Type": "multipart/form-data" , Authorization: `Bearer ${localStorage.getItem("logIn")}` },
            });

            setFileName(resp.data); // 서버에서 받은 파일명
            await axios.post("http://localhost:8080/api/product/upload/img", resp.data,{
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })
            Swal.fire({ icon: "success", title: "성공", text: "이미지 업로드 성공!" });
        } catch (error) {
            Swal.fire({ icon: "error", title: "실패", text: "업로드 실패" });
        }
    };

    return (
        <div>
            <input type="file" onChange={handleUpload} />
            {fileName && <p>서버 저장 파일명: {fileName}</p>}
            <img src={`http://localhost:8080/images/${fileName}`} alt="img" />
        </div>
    );
}
