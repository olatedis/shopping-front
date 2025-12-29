import {Form, Container, Card, Button} from "react-bootstrap";
import {useState} from "react";
import axios from "axios";
import {useNavigate} from "react-router-dom";
import Swal from "sweetalert2";

const LogInPage = () => {
    const [inputs, setInputs] = useState({
        user_id: '',
        password: ''
    })
    const navigate = useNavigate();

    const {user_id, password} = inputs

    const onChange = (e) => {
        const {name, value} = e.target;
        setInputs({
            ...inputs,
            [name]: value
        });
    }

    const onLogIn = async (e) => {
        e.preventDefault();
        const formData = {
            userId: user_id,
            password: password
        }
        try {
            const resp = await axios.post("http://localhost:8080/api/member/auth", formData);
            const data = resp.data;

            if (data && data !== 'fail') {
                localStorage.setItem('logIn', data);
                navigate('/product/list');
            } else {
                await Swal.fire({
                    icon: 'error',
                    title: '로그인 실패',
                    text: '아이디 또는 비밀번호가 일치하지 않습니다.',
                    confirmButtonColor: '#b8a6ff'
                });
                setInputs({
                    userId: '',
                    password: ''
                });
            }
        } catch (error) {
            console.error("Login error:", error);
            await Swal.fire({
                icon: 'error',
                title: '오류 발생',
                text: '로그인 중 오류가 발생했습니다.',
                confirmButtonColor: '#b8a6ff'
            });
        }
    }


    return (
        <Container className="d-flex align-items-center justify-content-center min-vh-100">
            <Card className="shadow-lg border-0" style={{ width: '100%', maxWidth: '450px' }}>
                <Card.Body className="p-5">
                    <div className="text-center mb-5">
                        <h1 className="display-6 text-primary mb-2">🛍️</h1>
                        <h2 className="section-title">로그인</h2>
                        <p className="text-gray">쇼핑몰에 로그인하세요</p>
                    </div>

                    <Form onSubmit={onLogIn}>
                        <Form.Group className="mb-4">
                            <Form.Label className="fw-bold text-dark mb-2">아이디</Form.Label>
                            <Form.Control 
                                type="text" 
                                name="user_id" 
                                onChange={onChange} 
                                value={user_id} 
                                autoComplete="off"
                                placeholder="아이디를 입력하세요"
                            />
                        </Form.Group>
                        <Form.Group className="mb-4">
                            <Form.Label className="fw-bold text-dark mb-2">비밀번호</Form.Label>
                            <Form.Control 
                                type="password" 
                                name="password" 
                                onChange={onChange} 
                                value={password}
                                placeholder="비밀번호를 입력하세요"
                            />
                        </Form.Group>

                        <Button 
                            variant="primary" 
                            className="w-100 fw-bold py-2 mb-3"
                            type="submit"
                        >
                            로그인
                        </Button>
                        
                        <div className="text-center">
                            <span className="text-gray">아직 회원이 아니신가요? </span>
                            <Button 
                                variant="link" 
                                className="text-primary fw-bold p-0"
                                onClick={() => navigate("/user/register")}
                            >
                                회원가입
                            </Button>
                        </div>
                    </Form>
                </Card.Body>
            </Card>
        </Container>
    )
}

export default LogInPage;