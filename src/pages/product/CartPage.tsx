import {useEffect, useState} from "react";
import axios from "axios";
import {Link, useNavigate} from "react-router-dom";
import Swal from "sweetalert2";
import RecentlyViewedProducts from "./RecentlyViewedProducts";

type Cart = {
    id: number;
    memberId: number;
    productId: number;
    sellPrice: number;
    quantity: number;
    productTitle: string;
    status: string;
    productStatus: string; // 상품 상태 (ON_SALE, SOLD_OUT)
    img: string;
};

const CartPage = () => {
    const [carts, setCarts] = useState<Cart[]>([]);
    const [id, setId] = useState<number>();
    const [totalPrice, setTotalPrice] = useState(0);
    const navigate = useNavigate();
    const token = localStorage.getItem("logIn");

    const DEFAULT_IMAGE = "http://localhost:8080/images/animated-icon-loading-19021458.gif";

    // 로그인 사용자 정보 불러오기
    useEffect(() => {
        const token = localStorage.getItem("logIn");
        if (!token) {
            Swal.fire({ icon: "warning", title: "로그인 필요", text: "로그인이 필요합니다." }).then(() => navigate("/"));
            return;
        }

        axios
            .get("http://localhost:8080/api/member/me", {
                headers: {Authorization: `Bearer ${token}`},
            })
            .then((res) => setId(res.data.id))
            .catch((e) => console.error(e));
    }, [navigate]);

    // 장바구니 목록 가져오기 + 총합 계산
    useEffect(() => {
        if (!id) return;


        axios
            .get(`http://localhost:8080/api/cart/list/${id}`,{
                headers: {Authorization: `Bearer ${token}`},
            })
            .then((res) => {
                setCarts(res.data);
                calcTotal(res.data);
            });
    }, [id]);

    // 총합 계산 함수
    const calcTotal = (list: Cart[]) => {
        const total = list.reduce(
            (sum, item) => sum + item.sellPrice * item.quantity,
            0
        );
        setTotalPrice(total);
    };

    // 수량 증가
    const increaseQuantity = (cart: Cart) => {
        if (!id) return;

        const updated = { ...cart, quantity: cart.quantity + 1 };

        axios
            .post("http://localhost:8080/api/cart/update", updated,{
                headers: {Authorization: `Bearer ${token}`},
            })
            .then(() => {
                const newList = carts.map((c) =>
                    c.id === cart.id ? { ...c, quantity: c.quantity + 1 } : c
                );
                setCarts(newList);
                calcTotal(newList);
            });
    };

    // 수량 감소
    const decreaseQuantity = (cart: Cart) => {
        if (!id) return;

        if (cart.quantity <= 1) return;

        const updated = { ...cart, quantity: cart.quantity - 1 };

        axios
            .post("http://localhost:8080/api/cart/update", updated,{
                headers: {Authorization: `Bearer ${token}`},
            })
            .then(() => {
                const newList = carts.map((c) =>
                    c.id === cart.id ? { ...c, quantity: c.quantity - 1 } : c
                );
                setCarts(newList);
                calcTotal(newList);
            });
    };

    // 개별 삭제
    const deleteItem = (cartId: number) => {
        if (!id) return;
        axios.post(`http://localhost:8080/api/cart/delete/${cartId}`,{},{
            headers: {Authorization: `Bearer ${token}`},
        }).then(() => {
            const newList = carts.filter((c) => c.id !== cartId);
            setCarts(newList);
            calcTotal(newList);
        });
    };

    // 전체 비우기
    const clearCart = () => {
        axios.post(`http://localhost:8080/api/cart/clear/${id}`,{},{
            headers: {Authorization: `Bearer ${token}`},
        }).then(() => {
            setCarts([]);
            setTotalPrice(0);
        });
        Swal.fire({ icon: "success", title: "완료", text: "전체 삭제되었습니다." });
    };

    // 품절 상품 여부 확인
    const hasSoldOutProducts = carts.some((item) => item.productStatus === "SOLD_OUT");

    return (
        <div className="container py-4">
            <h2 className="mb-4">장바구니</h2>
            <div className="mb-3">
                <button onClick={clearCart} className="btn btn-sm btn-outline-primary rounded-pill me-2">전체 비우기</button>
                <button onClick={() => navigate('/product/orderlist')} className="btn btn-sm btn-outline-secondary rounded-pill">내 주문정보 보기</button>
            </div>

            {carts.length === 0 ? (
                <div className="text-center text-muted py-5">장바구니가 비어 있습니다.</div>
            ) : (
                <>
                    <div className="row g-4 mb-4">
                        {carts.map((item) => (
                            <div key={item.id} className="col-md-6 col-lg-3">
                                <div className={`card h-100 shadow-sm border-0 ${item.productStatus === "SOLD_OUT" ? "opacity-75" : ""}`}>
                                    <div style={{height: "200px", overflow: "hidden", borderRadius: "0.75rem 0.75rem 0 0", position: "relative"}}>
                                        <img
                                            src={
                                                item.img
                                                    ? `http://localhost:8080/images/${item.img.replace('=', '')}`
                                                    : DEFAULT_IMAGE
                                            }
                                            alt={item.productTitle}
                                            style={{width: "100%", height: "100%", objectFit: "cover"}}
                                        />
                                        {item.productStatus === "SOLD_OUT" && (
                                            <div style={{
                                                position: "absolute",
                                                top: 0,
                                                left: 0,
                                                right: 0,
                                                bottom: 0,
                                                backgroundColor: "rgba(0,0,0,0.5)",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                color: "white",
                                                fontSize: "1.2rem",
                                                fontWeight: "bold"
                                            }}>
                                                품절
                                            </div>
                                        )}
                                    </div>
                                    <div className="card-body d-flex flex-column">
                                        <Link to={`/product/showOne/${item.productId}`} style={{textDecoration: "none"}}>
                                            <h5 className="card-title text-dark">{item.productTitle}</h5>
                                        </Link>
                                        <p className="text-primary fw-bold mb-3">{item.sellPrice.toLocaleString()} 원</p>

                                        <div className="d-flex gap-1 align-items-center justify-content-center mb-2">
                                            <button
                                                onClick={() => decreaseQuantity(item)}
                                                disabled={item.quantity <= 1}
                                                className="btn btn-sm btn-outline-secondary rounded-pill"
                                                style={{width: "32px", padding: "0"}}
                                            >
                                                −
                                            </button>
                                            <span className="fw-bold" style={{minWidth: "30px", textAlign: "center"}}>{item.quantity}</span>
                                            <button 
                                                onClick={() => increaseQuantity(item)} 
                                                className="btn btn-sm btn-outline-secondary rounded-pill"
                                                style={{width: "32px", padding: "0"}}
                                            >
                                                +
                                            </button>
                                        </div>

                                        <button 
                                            onClick={() => deleteItem(item.id)} 
                                            className="btn btn-sm btn-outline-danger w-100 rounded-pill"
                                        >
                                            삭제
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="border-top pt-4 text-end">
                        <h4 className="mb-3">총합: <span className="text-primary fw-bold">{totalPrice.toLocaleString()} 원</span></h4>
                        {hasSoldOutProducts && (
                            <div className="alert alert-warning mb-3" role="alert">
                                ⚠️ 장바구니에 품절된 상품이 있습니다. 품절 상품을 제거한 후 주문하세요.
                            </div>
                        )}
                        <button
                            onClick={() => navigate("/product/payment", { state: { carts } })}
                            className="btn btn-primary btn-lg rounded-pill"
                            disabled={hasSoldOutProducts}
                        >
                            주문하기
                        </button>
                    </div>
                </>
            )}
            {/* 최근 본 상품 */}
            <RecentlyViewedProducts />
        </div>
    );
};

export default CartPage;
