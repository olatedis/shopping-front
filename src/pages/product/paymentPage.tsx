import {useLocation, useNavigate} from "react-router-dom";
import {useEffect, useRef, useState} from "react";
import Swal from "sweetalert2";
import axios from "axios";

const bankList = [
    "국민은행",
    "우리은행",
    "신한은행",
    "하나은행",
    "기업은행",
    "농협은행",
    "카카오뱅크",
    "토스뱅크",
    "SC은행",
    "씨티은행",
];
type Cart = {
    id: number;
    memberId: number;
    productId: number;
    sellPrice: number;
    quantity: number;
    productTitle: string;
    status: string;
    img: string;
};

type Member = {
    id: number;
    user_id: string;
    nickname: string;
    username: string;
    email: string;
    birthday: string;
    address: string;
    phone: string;
    gender: string;
};

const PaymentPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const carts: Cart[] = location.state?.carts ?? [];

    const [member, setMember] = useState<Member | null>(null);

    const addressRef = useRef<HTMLInputElement | null>(null);
    const phoneRef = useRef<HTMLInputElement | null>(null);

    const [address, setAddress] = useState("");
    const [phone, setPhone] = useState("");
    const [memo, setMemo] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("card");
    const [receiptType, setReceiptType] = useState("none");
    const [bankName, setBankName] = useState("");




    // 유저 정보 가져오기
    useEffect(() => {
        const token = localStorage.getItem("logIn");
        if (!token) return;

        fetch("http://localhost:8080/api/member/me", {
            headers: {Authorization: `Bearer ${token}`},
        })
            .then((res) => res.json())
            .then((data) => {
                setMember(data);
                setAddress(data.address);
                setPhone(data.phone);
            });
    }, []);

    if (!carts || carts.length === 0) {
        return <div>장바구니 정보가 없습니다.</div>;
    }

    const productTotal = carts.reduce(
        (sum, item) => sum + item.sellPrice * item.quantity,
        0
    );

    const deliveryFee = 3000;
    const totalPrice = productTotal + deliveryFee;

    // 결제 실행
    const onPay = async () => {
        if (address.trim() === "") {
            await Swal.fire({ icon: "warning", title: "주소 필요", text: "주소를 입력해주세요!" });
            addressRef.current?.scrollIntoView();
            return;
        }
        if (phone.trim() === "") {
            await Swal.fire({ icon: "warning", title: "전화번호 필요", text: "전화번호를 입력해주세요!" });
            phoneRef.current?.scrollIntoView({behavior: "smooth"});
            return;
        }

        Swal.fire({
            title: "결제 중입니다...",
            text: "잠시만 기다려주세요.",
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            },
        });

        await new Promise((resolve) => setTimeout(resolve, 3000));

        Swal.fire({
            icon: "success",
            title: "결제 완료!",
            text: "결제가 정상적으로 처리되었습니다.",
        }).then(() => {

            // 주문 객체 생성
            const orderDto = {
                memberId: member!.id,
                address: address,
                phone: phone,
                receiverName: member!.username,
                comment: memo,
                totalPrice: totalPrice,
                paymentMethod: paymentMethod,
                cashReceipt: receiptType
            };

            // 주문 상세 리스트 생성
            const orderDetailDto = carts.map((item) => ({
                productId: item.productId,
                quantity: item.quantity,
                totalPrice: item.sellPrice * item.quantity,
            }));


            // 서버로 전송할 request
            const request = {
                orderDto: orderDto,
                orderDetailDto: orderDetailDto,
            };

            const token = localStorage.getItem("logIn");

            axios.post("http://localhost:8080/api/order/newOrder", request, {
                headers: { Authorization: `Bearer ${token}` },
            })
                .then(() => {
                    // 결제 성공 후 카트 비우기
                    if (member) {
                        axios.post(`http://localhost:8080/api/cart/clear/${member.id}`, {}, {
                            headers: { Authorization: `Bearer ${token}` },
                        });
                    }

                    navigate("/product/orderlist");
                })
                .catch((err) => {
                    console.error("주문 실패:", err);
                    Swal.fire("에러", "주문 처리 중 문제가 발생했습니다.", "error");
                });
        });
    };

    return (
        <div className="container py-4">
            <h2 className="mb-4 fw-bold">결제</h2>

            <div className="row g-4">
                {/* 좌측: 주문 상품 + 배송 정보 */}
                <div className="col-lg-7">
                    {/* 주문 상품 카드 */}
                    <div className="card shadow-sm mb-4 border-0">
                        <div className="card-header bg-light border-0">
                            <h5 className="mb-0 fw-bold">주문 상품</h5>
                        </div>
                        <div className="card-body">
                            <div className="table-responsive">
                                <table className="table table-sm align-middle mb-0">
                                    <thead className="table-light">
                                        <tr>
                                            <th>상품명</th>
                                            <th className="text-end">수량</th>
                                            <th className="text-end">가격</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {carts.map((item) => (
                                            <tr key={item.id}>
                                                <td className="fw-500">{item.productTitle}</td>
                                                <td className="text-end">{item.quantity}개</td>
                                                <td className="text-end fw-bold text-primary">{item.sellPrice.toLocaleString()}원</td>
                                            </tr>
                                        ))}
                                        <tr className="border-top">
                                            <td colSpan={2} className="text-end fw-bold">배송비</td>
                                            <td className="text-end fw-bold">{deliveryFee.toLocaleString()}원</td>
                                        </tr>
                                        <tr className="table-light">
                                            <td colSpan={2} className="text-end fw-bold">합계</td>
                                            <td className="text-end fs-5 fw-bold text-primary">{totalPrice.toLocaleString()}원</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* 배송 정보 카드 */}
                    <div className="card shadow-sm border-0">
                        <div className="card-header bg-light border-0">
                            <h5 className="mb-0 fw-bold">배송 정보</h5>
                        </div>
                        <div className="card-body">
                            <div className="mb-3">
                                <label className="form-label fw-bold">주소</label>
                                <input
                                    ref={addressRef}
                                    type="text"
                                    className="form-control"
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    placeholder="배송받을 주소를 입력하세요"
                                />
                            </div>

                            <div className="mb-3">
                                <label className="form-label fw-bold">전화번호</label>
                                <input
                                    ref={phoneRef}
                                    type="text"
                                    className="form-control"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="전화번호를 입력하세요"
                                />
                            </div>

                            <div className="mb-0">
                                <label className="form-label fw-bold">배송 메모</label>
                                <select
                                    className="form-select"
                                    value={memo}
                                    onChange={(e) => setMemo(e.target.value)}
                                >
                                    <option value="">메모 없음</option>
                                    <option value="문 앞에 놓아주세요">문 앞에 놓아주세요</option>
                                    <option value="부재 시 경비실에 맡겨주세요">부재 시 경비실에 맡겨주세요</option>
                                    <option value="배송 전 연락 바랍니다">배송 전 연락 바랍니다</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 우측: 결제 수단 + 결제 버튼 */}
                <div className="col-lg-5">
                    {/* 결제 수단 카드 */}
                    <div className="card shadow-sm border-0 sticky-top" style={{top: "20px"}}>
                        <div className="card-header bg-light border-0">
                            <h5 className="mb-0 fw-bold">결제 수단</h5>
                        </div>
                        <div className="card-body">
                            <div className="mb-3">
                                <div className="form-check">
                                    <input
                                        className="form-check-input"
                                        type="radio"
                                        id="method-card"
                                        value="card"
                                        checked={paymentMethod === "card"}
                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                    />
                                    <label className="form-check-label" htmlFor="method-card">
                                        신용카드
                                    </label>
                                </div>
                            </div>

                            <div className="mb-3">
                                <div className="form-check">
                                    <input
                                        className="form-check-input"
                                        type="radio"
                                        id="method-bank"
                                        value="bank"
                                        checked={paymentMethod === "bank"}
                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                    />
                                    <label className="form-check-label" htmlFor="method-bank">
                                        계좌이체
                                    </label>
                                </div>
                            </div>

                            <div className="mb-3">
                                <div className="form-check">
                                    <input
                                        className="form-check-input"
                                        type="radio"
                                        id="method-kakao"
                                        value="kakao"
                                        checked={paymentMethod === "kakao"}
                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                    />
                                    <label className="form-check-label" htmlFor="method-kakao">
                                        카카오페이
                                    </label>
                                </div>
                            </div>

                            <div className="mb-4">
                                <div className="form-check">
                                    <input
                                        className="form-check-input"
                                        type="radio"
                                        id="method-naver"
                                        value="naverpay"
                                        checked={paymentMethod === "naverpay"}
                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                    />
                                    <label className="form-check-label" htmlFor="method-naver">
                                        네이버페이
                                    </label>
                                </div>
                            </div>

                            {/* 신용카드 선택 시 은행 선택 */}
                            {paymentMethod === "card" && (
                                <div className="mb-4">
                                    <label className="form-label fw-bold">카드 은행</label>
                                    <select
                                        className="form-select"
                                        value={bankName}
                                        onChange={(e) => setBankName(e.target.value)}
                                    >
                                        <option value="">선택하세요</option>
                                        {bankList.map((b) => (
                                            <option key={b} value={b}>
                                                {b}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* 계좌이체 선택 시 현금영수증 */}
                            {paymentMethod === "bank" && (
                                <div className="mb-4">
                                    <label className="form-label fw-bold">현금영수증 발급</label>
                                    <select
                                        className="form-select"
                                        value={receiptType}
                                        onChange={(e) => setReceiptType(e.target.value)}
                                    >
                                        <option value="none">발급 안 함</option>
                                        <option value="personal">개인 소득공제용</option>
                                        <option value="business">사업자 지출증빙용</option>
                                    </select>
                                </div>
                            )}

                            <div className="border-top pt-3 mb-3">
                                <div className="d-flex justify-content-between mb-2">
                                    <span>상품 금액</span>
                                    <span className="fw-bold">{productTotal.toLocaleString()}원</span>
                                </div>
                                <div className="d-flex justify-content-between mb-3">
                                    <span>배송비</span>
                                    <span className="fw-bold">{deliveryFee.toLocaleString()}원</span>
                                </div>
                                <div className="d-flex justify-content-between fs-5 fw-bold text-primary">
                                    <span>결제 금액</span>
                                    <span>{totalPrice.toLocaleString()}원</span>
                                </div>
                            </div>

                            <button 
                                className="btn btn-primary btn-lg w-100 rounded-pill fw-bold" 
                                onClick={onPay}
                            >
                                {totalPrice.toLocaleString()}원 결제하기
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentPage;
