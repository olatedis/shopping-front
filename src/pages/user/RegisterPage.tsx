import {useState} from "react"
import {useNavigate, Link} from "react-router-dom"
import {Card, Form, Button, Row, Col, Alert, Container} from "react-bootstrap"
import axios from "axios";
import Swal from "sweetalert2";

declare global {
    interface Window {
        daum: any;
    }
}

function RegisterPage() {
    const [userId, setUserId] = useState("")
    const [password, setPassword] = useState("")
    const [password2, setPassword2] = useState("")
    const [nickname, setNickname] = useState("")
    const [username, setUsername] = useState("")
    const [email, setEmail] = useState("")
    const [birthday, setBirthday] = useState("")
    const [address, setAddress] = useState("")
    const [detailAddress, setDetailAddress] = useState("")
    const [phone, setPhone] = useState("")
    const [gender, setGender] = useState("남자")
    const [error, setError] = useState("")
    const navigate = useNavigate()

    const today = new Date().toISOString().split("T")[0];

    const handleAddressSearch = () => {
        if (window.daum && window.daum.Postcode) {
            new window.daum.Postcode({
                oncomplete: function (data: { address: string }) {
                    setAddress(data.address);
                },
            }).open();
        }
    };


    const handleSubmit = async (e) => {
        e.preventDefault()
        setError("")

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
            setError("유효한 이메일 주소를 입력해주세요.")
            window.scrollTo(0, 0);
            return
        }

        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
        if (!passwordRegex.test(password)) {
            setError("비밀번호는 8자 이상이며, 대문자, 소문자, 숫자, 특수문자(@,$,!,%,*,?,&)를 각각 하나 이상 포함해야 합니다.")
            window.scrollTo(0, 0);
            return
        }

        const phoneRegex = /^010-\d{4}-\d{4}$/
        if (!phoneRegex.test(phone)) {
            setError("유효한 전화번호를 입력해주세요. (010-1234-5678)")
            window.scrollTo(0, 0);
            return
        }

        if (!userId || !password || !password2 || !nickname || !username || !email || !gender || !birthday || !address || !detailAddress || !phone) {
            setError("모든 필드를 입력해 주세요.")
            window.scrollTo(0, 0);
            return
        }
        if (password !== password2) {
            setError("비밀번호가 서로 일치하지 않습니다.")
            window.scrollTo(0, 0);
            return
        }

        const resp =
            await axios.get('http://localhost:8080/api/member/validate', {
                params: {username: userId},
            })

        if (resp.data === false) {
            setError('중복된 아이디입니다.')
            window.scrollTo(0, 0);
            return
        }

        const fullAddress = `${address} ${detailAddress}`.trim();

        const newUser = {
            userId,
            password,
            nickname,
            username,
            email,
            birthday,
            address: fullAddress,
            phone,
            gender
        }
        await axios.post("http://localhost:8080/api/member/register", newUser)

        await Swal.fire({
            icon: 'success',
            title: '가입 완료',
            text: '회원가입이 완료되었습니다. 로그인해주세요.',
            confirmButtonColor: '#b8a6ff'
        });
        navigate("/")
    }

    return (
        <Container className="py-5">
            <Row className="justify-content-center">
                <Col xs={12} md={8}>
                    <Card className="shadow-lg border-0">
                        <Card.Body className="p-5">
                            <div className="text-center mb-4">
                                <h1 className="display-6 text-primary mb-2">👤</h1>
                                <h2 className="section-title">회원가입</h2>
                                <p className="text-gray">쇼핑몰에 가입하세요</p>
                            </div>

                            {error && <Alert variant="danger" className="alert-info">{error}</Alert>}

                            <Form onSubmit={handleSubmit}>
                                <Form.Group className="mb-4" controlId="signupUsername">
                                    <Form.Label className="fw-bold mb-2">아이디</Form.Label>
                                    <Form.Control
                                        autoComplete={'off'}
                                        type="text"
                                        value={userId}
                                        onChange={(e) => setUserId(e.target.value)}
                                        placeholder="아이디를 입력하세요"
                                        name="userId"
                                    />
                                </Form.Group>

                                <Form.Group className="mb-4" controlId="signupPassword">
                                    <Form.Label className="fw-bold mb-2">비밀번호</Form.Label>
                                    <Form.Control
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="비밀번호를 입력하세요"
                                        name="password"
                                    />
                                    <small className="text-gray">8자 이상, 대/소문자, 숫자, 특수문자 포함</small>
                                </Form.Group>

                                <Form.Group className="mb-4" controlId="signupPassword2">
                                    <Form.Label className="fw-bold mb-2">비밀번호 확인</Form.Label>
                                    <Form.Control
                                        type="password"
                                        value={password2}
                                        onChange={(e) => setPassword2(e.target.value)}
                                        placeholder="비밀번호를 다시 입력하세요"
                                    />
                                </Form.Group>

                                <Row>
                                    <Col md={6}>
                                        <Form.Group className="mb-4" controlId="signupNickname">
                                            <Form.Label className="fw-bold mb-2">닉네임</Form.Label>
                                            <Form.Control
                                                autoComplete={'off'}
                                                type="text"
                                                value={nickname}
                                                onChange={(e) => setNickname(e.target.value)}
                                                placeholder="닉네임을 입력하세요"
                                                name="nickname"
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-4" controlId="signupName">
                                            <Form.Label className="fw-bold mb-2">이름</Form.Label>
                                            <Form.Control
                                                autoComplete={'off'}
                                                type="text"
                                                value={username}
                                                onChange={(e) => setUsername(e.target.value)}
                                                placeholder="이름을 입력하세요"
                                                name="user_name"
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <Form.Group className="mb-4" controlId="signupEmail">
                                    <Form.Label className="fw-bold mb-2">이메일</Form.Label>
                                    <Form.Control
                                        autoComplete={'off'}
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="이메일을 입력하세요"
                                        name="email"
                                    />
                                </Form.Group>

                                <Row>
                                    <Col md={6}>
                                        <Form.Group className="mb-4" controlId="signupBirthday">
                                            <Form.Label className="fw-bold mb-2">생년월일</Form.Label>
                                            <Form.Control
                                                autoComplete={'off'}
                                                type="date"
                                                value={birthday}
                                                onChange={(e) => setBirthday(e.target.value)}
                                                name="birthday"
                                                max={today}
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-4" controlId="signupGender">
                                            <Form.Label className="fw-bold mb-2">성별</Form.Label>
                                            <Form.Select
                                                value={gender}
                                                onChange={(e) => setGender(e.target.value)}
                                            >
                                                <option value="남자">남자</option>
                                                <option value="여자">여자</option>
                                                <option value="비공개">비공개</option>
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <Form.Group className="mb-4">
                                    <Form.Label className="fw-bold mb-2">주소</Form.Label>
                                    <Row className="mb-3">
                                        <Col>
                                            <Form.Control
                                                autoComplete={'off'}
                                                type="text"
                                                value={address}
                                                readOnly
                                                placeholder="주소를 입력하세요"
                                                name="address"
                                            />
                                        </Col>
                                        <Col xs="auto">
                                            <Button 
                                                variant="outline-primary"
                                                onClick={handleAddressSearch}
                                                className="fw-600"
                                            >
                                                찾기
                                            </Button>
                                        </Col>
                                    </Row>
                                    <Form.Control
                                        autoComplete={'off'}
                                        type="text"
                                        value={detailAddress}
                                        onChange={(e) => setDetailAddress(e.target.value)}
                                        placeholder="상세주소를 입력하세요"
                                        name="detailAddress"
                                    />
                                </Form.Group>

                                <Form.Group className="mb-5" controlId="signupNumber">
                                    <Form.Label className="fw-bold mb-2">전화번호</Form.Label>
                                    <Form.Control
                                        autoComplete={'off'}
                                        type="text"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        placeholder="010-1234-5678"
                                        name="phone"
                                    />
                                </Form.Group>

                                <Button 
                                    type="submit" 
                                    variant="primary"
                                    className="w-100 fw-bold py-2 mb-3"
                                >
                                    회원가입
                                </Button>
                            </Form>

                            <div className="text-center">
                                <span className="text-gray">이미 계정이 있으신가요? </span>
                                <Link to="/" className="fw-bold">로그인</Link>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    )
}

export default RegisterPage