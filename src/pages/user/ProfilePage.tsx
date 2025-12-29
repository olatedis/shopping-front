import {useState, useEffect} from "react"
import {useNavigate} from "react-router-dom"
import {Card, Form, Button, Row, Col, Alert, Container} from "react-bootstrap"
import axios from "axios";
import Swal from "sweetalert2";
import RecentlyViewedProducts from "../product/RecentlyViewedProducts";

// Daum 주소 API를 위한 타입 선언
declare global {
    interface Window {
        daum: any;
    }
}

function ProfilePage() {

    const [userId, setUserId] = useState("");
    const [nickname, setNickname] = useState("");
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [birthday, setBirthday] = useState("");
    const [address, setAddress] = useState("");
    const [phone, setPhone] = useState("");
    const [gender, setGender] = useState("");

    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [newPassword2, setNewPassword2] = useState("");

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const navigate = useNavigate();
    const today = new Date().toISOString().split("T")[0];

    useEffect(() => {
        const fetchMyInfo = async () => {
            const token = localStorage.getItem('logIn');
            if (!token) {
                Swal.fire({ icon: "warning", title: "로그인 필요", text: "로그인이 필요합니다." });
                navigate('/user/login');
                return;
            }


            try {
                const response = await axios.get('http://localhost:8080/api/member/me', {
                    headers: {

                        Authorization: `Bearer ${token}`
                    }
                });
                const data = response.data;
                setUserId(data.userId);
                setNickname(data.nickname || "");
                setUsername(data.username || "");
                setEmail(data.email || "");
                setBirthday(data.birthday ? new Date(data.birthday).toISOString().substring(0, 10) : "");                setAddress(data.address || "");
                setPhone(data.phone || "");
                setGender(data.gender || "남자");
            } catch (e) {
                setError("회원 정보를 불러오는 데 실패했습니다.");
                window.scrollTo(0, 0);
                console.error(e);
            }
        };

        fetchMyInfo();
    }, []);

    const handleAddressSearch = () => {
        if (window.daum && window.daum.Postcode) {
            new window.daum.Postcode({
                oncomplete: function (data: { address: string }) {
                    setAddress(data.address);
                },
            }).open();
        }
    };

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        // 이메일 정규식 검증
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setError("유효한 이메일 주소를 입력해주세요.");
            window.scrollTo(0, 0);
            return;
        }

        // 전화번호 정규식 검증
        const phoneRegex = /^010-\d{4}-\d{4}$/;
        if (!phoneRegex.test(phone)) {
            setError("유효한 전화번호를 입력해주세요. (010-1234-5678)");
            window.scrollTo(0, 0);
            return;
        }

        const updatedProfile = { user_id: userId, nickname, username, email, birthday, address, phone, gender };

        try {
            await axios.post('http://localhost:8080/api/member/profile', updatedProfile, {
                headers: { Authorization: `Bearer ${localStorage.getItem('logIn')}` }
            });
            setSuccess("회원 정보가 성공적으로 수정되었습니다.");
            window.scrollTo(0, 0);
        } catch (err) {
            setError("정보 수정에 실패했습니다. 다시 시도해주세요.");
            window.scrollTo(0, 0);
        }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        // 비밀번호 정규식 검증 추가
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(newPassword)) {
            setError("비밀번호는 8자 이상이며, 대문자, 소문자, 숫자, 특수문자(@,$,!,%,*,?,&)를 각각 하나 이상 포함해야 합니다.");
            window.scrollTo(0, 0);
            return;
        }

        if (newPassword !== newPassword2) {
            setError("새 비밀번호가 일치하지 않습니다.");
            window.scrollTo(0, 0);
            return;
        }

        try {
            await axios.post('http://localhost:8080/api/member/password', { oldPassword, newPassword }, {
                headers: { Authorization: `Bearer ${localStorage.getItem('logIn')}` }
            });
            
            await Swal.fire({
                icon: 'success',
                title: '변경 완료',
                text: '비밀번호가 성공적으로 변경되었습니다.',
            });

            navigate('/'); // 메인 페이지로 이동
            localStorage.removeItem('logIn');

        } catch (err: any) {
            setError(err.response?.data || "비밀번호 변경에 실패했습니다.");
            window.scrollTo(0, 0);
        }
    };

    const handleWithdraw = async () => {
        setError("");
        setSuccess("");

        if (window.confirm("정말로 회원 탈퇴를 하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) {
            try {
                await axios.post('http://localhost:8080/api/member/withdraw', {}, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('logIn')}` }
                });
                localStorage.removeItem('logIn');
                Swal.fire({ icon: "success", title: "완료", text: "회원 탈퇴가 완료되었습니다." });
                navigate('/');
            } catch (err) {
                setError("회원 탈퇴 처리 중 오류가 발생했습니다.");
                window.scrollTo(0, 0);
            }
        }
    };

    return (
        <Container className="my-4">
            <Row className="justify-content-center">
                <Col md={10}>
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h2 className="mb-0">마이 페이지</h2>
                    </div>

                    {error && <Alert variant="danger">{error}</Alert>}
                    {success && <Alert variant="success">{success}</Alert>}

                    <Row className="g-4">
                        <Col md={4}>
                            <Card className="text-center shadow-sm">
                                <Card.Body>
                                            <h5 className="fw-bold mb-2">{nickname || username}</h5>
                                            <div className="text-muted mb-2">{email}</div>
                                            <div className="mb-3 text-muted small">{address || '-'} · {phone || '-'}</div>

                                            <div className="d-grid gap-2">
                                                <Button variant="primary" onClick={() => navigate('/product/orderlist')}>내 주문정보 보기</Button>
                                                <Button variant="outline-danger" onClick={handleWithdraw}>회원 탈퇴</Button>
                                            </div>
                                </Card.Body>
                            </Card>

                            <div className="mt-3 recent-list">
                                <RecentlyViewedProducts layout="list" />
                            </div>
                        </Col>

                        <Col md={8}>
                            <Card className="shadow-sm mb-4">
                                <Card.Body>
                                    <Card.Title className="mb-3">회원 정보 수정</Card.Title>
                                    <Form onSubmit={handleProfileUpdate}>
                                        <Row>
                                            <Col md={6} className="mb-3">
                                                <Form.Label>아이디</Form.Label>
                                                <Form.Control type="text" value={userId} readOnly disabled />
                                            </Col>
                                            <Col md={6} className="mb-3">
                                                <Form.Label>닉네임</Form.Label>
                                                <Form.Control type="text" value={nickname} onChange={e => setNickname(e.target.value)} />
                                            </Col>
                                        </Row>

                                        <Row>
                                            <Col md={6} className="mb-3">
                                                <Form.Label>이름</Form.Label>
                                                <Form.Control type="text" value={username} onChange={e => setUsername(e.target.value)} />
                                            </Col>
                                            <Col md={6} className="mb-3">
                                                <Form.Label>이메일</Form.Label>
                                                <Form.Control type="email" value={email} onChange={e => setEmail(e.target.value)} />
                                            </Col>
                                        </Row>

                                        <Row>
                                            <Col md={6} className="mb-3">
                                                <Form.Label>생년월일</Form.Label>
                                                <Form.Control type="date" value={birthday} onChange={e => setBirthday(e.target.value)} max={today} />
                                            </Col>
                                            <Col md={6} className="mb-3">
                                                <Form.Label>전화번호</Form.Label>
                                                <Form.Control type="text" value={phone} onChange={e => setPhone(e.target.value)} />
                                            </Col>
                                        </Row>

                                        <Form.Group className="mb-3">
                                            <Form.Label>주소</Form.Label>
                                            <Row>
                                                <Col>
                                                    <Form.Control type="text" value={address} onChange={e => setAddress(e.target.value)}/>
                                                </Col>
                                                <Col xs="auto">
                                                    <Button onClick={handleAddressSearch}>주소 찾기</Button>
                                                </Col>
                                            </Row>
                                        </Form.Group>

                                        <Form.Group className="mb-3">
                                            <Form.Label>성별</Form.Label>
                                            <div>
                                                        <Form.Select value={gender} onChange={e => setGender(e.target.value)}>
                                                            <option value="남자">남자</option>
                                                            <option value="여자">여자</option>
                                                            <option value="비공개">비공개</option>
                                                        </Form.Select>
                                            </div>
                                        </Form.Group>

                                        <div className="d-flex justify-content-end gap-2">
                                            <Button type="submit" variant="primary">정보 수정</Button>
                                        </div>
                                    </Form>
                                </Card.Body>
                            </Card>

                            <Card className="shadow-sm">
                                <Card.Body>
                                    <Card.Title className="mb-3">비밀번호 변경</Card.Title>
                                    <Form onSubmit={handlePasswordChange}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>기존 비밀번호</Form.Label>
                                            <Form.Control type="password" value={oldPassword} onChange={e => setOldPassword(e.target.value)} />
                                        </Form.Group>
                                        <Form.Group className="mb-3">
                                            <Form.Label>새 비밀번호</Form.Label>
                                            <Form.Control type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                                        </Form.Group>
                                        <Form.Group className="mb-3">
                                            <Form.Label>새 비밀번호 확인</Form.Label>
                                            <Form.Control type="password" value={newPassword2} onChange={e => setNewPassword2(e.target.value)} />
                                        </Form.Group>
                                        <div className="d-flex justify-content-end">
                                            <Button type="submit" variant="warning">비밀번호 변경</Button>
                                        </div>
                                    </Form>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </Col>
            </Row>
        </Container>
    );
}

export default ProfilePage;
