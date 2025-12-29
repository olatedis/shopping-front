import {useEffect, useState} from "react";
import {useNavigate} from "react-router-dom";
import axios from "axios";
import {Button, Container, Nav, Navbar, NavDropdown} from "react-bootstrap";
import AdminMenu from "./AdminMenu.tsx";
import Swal from "sweetalert2";

export default function Header() {
    const navigate = useNavigate();
    const [isLogin, setIsLogin] = useState(false);
    const [username, setUsername] = useState("");
    const [role, setRole] = useState("");
    const [banned, setBanned] = useState(false);
    // 밴 계정 처리 공통
    const handleBanned = async () => {
        localStorage.removeItem("logIn");
        setIsLogin(false);
        setUsername("");
        setRole("");

        await Swal.fire({icon: "error", title: "제한된계정입니다", text: "고객센터에 문의해주세요.",});
        navigate("/");
    };


    useEffect(() => {
        // 로그인 토큰이 있다면 로그인 상태로 판단
        const token = localStorage.getItem("logIn");

        if (!token) {
            setIsLogin(false);
            setUsername("");
            setRole("");
            return;
        }
        const fetchMe = async () => {
            try {

                if (token) {
                    setIsLogin(true);
                    axios.get('http://localhost:8080/api/member/me', {
                        headers: {Authorization: `Bearer ${token}`}
                    }).then(res => {
                        setRole(res.data.role);
                        const name = res.data.nickname;
                        if (name) setUsername(name);
                        setBanned(res.data.banned)
                        if (banned) handleBanned();
                        return;
                    })
                } else {
                    setIsLogin(false);
                }

            } catch (err: any) {
                console.error(err);
                localStorage.remveItem("logIn");
                setIsLogin(false);
                setUsername("");
                setRole("");
            }
        };
        fetchMe();

    }, [navigate]);

    const onLogout = () => {
        localStorage.removeItem("logIn");
        setIsLogin(false);
        navigate("/product/list");
        setUsername('');
        setRole('');
    };

    return (
        <Navbar style={{ backgroundColor: "#e8e3ff" }} expand="lg" className="sticky-top shadow-sm">
            <Container>
                <Navbar.Brand
                    style={{cursor: "pointer"}}
                    onClick={() => navigate("/product/list")}
                    className="fw-bold text-dark fs-5"
                >
                    🛍️ Shopping Mall
                </Navbar.Brand>

                <Navbar.Toggle aria-controls="main-navbar"/>
                <Navbar.Collapse id="main-navbar">
                    <Nav className="align-items-center" style={{ gap: "12px" }}>
                        <Nav.Link onClick={() => navigate("/product/list")}>상품</Nav.Link>
                        <AdminMenu role={role} />
                        {role === "ROLE_SELLER" && (
                            <NavDropdown title="판매자" id="seller-menu">
                                <NavDropdown.Item onClick={() => navigate("/seller/product/showAll")}>
                                    내 상품 관리
                                </NavDropdown.Item>
                            </NavDropdown>
                        )}
                    </Nav>

                    <Nav className="ms-auto" style={{ gap: "12px", alignItems: "center" }}>
                        {!isLogin ? (
                            <div className="d-flex" style={{gap: "10px"}}>
                                <Button
                                    variant="outline-primary"
                                    onClick={() => navigate("/")}
                                >
                                    로그인
                                </Button>
                                <Button
                                    variant="primary"
                                    onClick={() => navigate("/user/register")}
                                >
                                    회원가입
                                </Button>
                            </div>
                        ) : (
                            <>
                                <Nav.Link onClick={() => navigate("/product/wishlist")}>❤️ 찜</Nav.Link>
                                <Nav.Link onClick={() => navigate("/product/cart")}>🛒 장바구니</Nav.Link>
                                <Nav.Link onClick={() => navigate("/user/mypage")}>👤 마이페이지</Nav.Link>
                                <div style={{ borderLeft: "1px solid #999", height: "20px" }}></div>
                                <span className="text-dark" style={{ fontSize: "0.9rem" }}>{username || "User"} 님</span>
                                <Button variant="outline-danger" size="sm" onClick={onLogout}>
                                    로그아웃
                                </Button>
                            </>
                        )}
                    </Nav>

                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
}
