import {useEffect, useState} from "react";
import {useNavigate, useParams} from "react-router-dom";
import axios from "axios";
import RecentlyViewedProducts from "../product/RecentlyViewedProducts";


type Order = {
    id: number;
    memberId: number;
    totalPrice: number;
    address: string;
    phone: string;
    receiverName: string;
    comment: string;
    status: string;
    paymentMethod: string;
    cashReceipt: string;
    orderDate: string;
}

type OrderDetail = {
    id: number;
    orderId: number;
    productId: number;
    marketId: number;
    quantity: number;
    totalPrice: number;
    productTitle: string;
    marketName: string;
}

// 상태 텍스트
const STATUS_LABELS: Record<string, string> = {
    ORDER_CHECKING: "주문확인중",
    PREPARING: "상품준비중",
    SHIPPING: "배송중",
    DELIVERED: "배송완료",
    COMPLETED: "구매확정",
    CANCELLED: "취소",
    RETURNED: "반품",
    EXCHANGED: "교환",
};

// 상태에 따른 색상
const getStatusBadgeClass = (status: string): string => {
    switch (status) {
        case "PREPARING":
            return "badge bg-warning text-dark";
        case "SHIPPING":
            return "badge bg-info text-dark";
        case "DELIVERED":
        case "COMPLETED":
            return "badge bg-success";
        case "CANCELLED":
        case "RETURNED":
        case "EXCHANGED":
            return "badge bg-danger";
        case "ORDER_CHECKING":
        default:
            return "badge bg-secondary";
    }
};

function OrderDetailPage() {
    const {orderId} = useParams();
    const [order, setOrder] = useState<Order>();
    const [details, setDetails] = useState<OrderDetail[]>([]);
    const navigate = useNavigate();
    const token = localStorage.getItem("logIn");

    useEffect(() => {
        axios.get(`http://localhost:8080/api/order/${orderId}`, {
            headers: {Authorization: `Bearer ${token}`}
        }).then(res => setOrder(res.data));

        axios.get(`http://localhost:8080/api/order/detail/${orderId}`, {
            headers: {Authorization: `Bearer ${token}`}
        }).then(res => setDetails(res.data));
    }, [orderId]);

    if (!order) return <div className="container mt-4">로딩중...</div>;

    const formatDate = (date: string) => {
        const d = new Date(date);
        return d.toLocaleString('ko-KR');
    };

    return (
        <div className="container py-4">
            <h2 className="mb-4 fw-bold">주문 상세</h2>

            {/* 주문 정보 섹션 */}
            <div className="card border-0 shadow-sm mb-4">
                <div className="card-body">
                    <div className="row">
                        <div className="col-md-8">
                            <div className="mb-3">
                                <small className="text-muted">주문번호</small>
                                <h5 className="fw-bold text-dark mb-0">{order.id}</h5>
                            </div>
                            <div className="mb-3">
                                <small className="text-muted">주문일시</small>
                                <p className="mb-0">{formatDate(order.orderDate)}</p>
                            </div>
                            <div className="mb-3">
                                <small className="text-muted">결제수단</small>
                                <p className="mb-0">{order.paymentMethod}</p>
                            </div>
                        </div>
                        <div className="col-md-4 text-md-end">
                            <small className="text-muted d-block mb-2">주문상태</small>
                            <span className={getStatusBadgeClass(order.status) + " fs-6"}>
                                {STATUS_LABELS[order.status] || order.status}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 배송 정보 카드 */}
            <div className="row g-3 mb-4">
                <div className="col-md-6">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-body">
                            <h6 className="card-title fw-bold text-dark mb-3">배송지</h6>
                            <div className="mb-3">
                                <small className="text-muted d-block">수령인</small>
                                <p className="mb-0 fw-500">{order.receiverName}</p>
                            </div>
                            <div className="mb-3">
                                <small className="text-muted d-block">배송주소</small>
                                <p className="mb-0">{order.address}</p>
                            </div>
                            <div>
                                <small className="text-muted d-block">연락처</small>
                                <p className="mb-0">{order.phone}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-md-6">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-body">
                            <h6 className="card-title fw-bold text-dark mb-3">주문요약</h6>
                            <div className="mb-3">
                                <small className="text-muted d-block">배송메모</small>
                                <p className="mb-0">{order.comment || "없음"}</p>
                            </div>
                            <div className="pt-3 border-top">
                                <div className="d-flex justify-content-between align-items-center">
                                    <span className="fw-bold">최종금액</span>
                                    <span className="text-primary fw-bold fs-5">
                                        {order.totalPrice.toLocaleString()}원
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 주문 상품 섹션 */}
            <h5 className="fw-bold mb-3">주문상품</h5>
            <div className="row g-3">
                {details.map((detail) => (
                    <div key={detail.id} className="col-md-6 col-lg-4">
                        <div className="card border-0 shadow-sm h-100">
                            <div className="card-body">
                                <h6
                                    className="card-title fw-bold text-dark cursor-pointer"
                                    style={{ cursor: "pointer" }}
                                    onClick={() => navigate(`/product/showOne/${detail.productId}`)}
                                    onMouseEnter={(e) => (e.currentTarget.style.color = "var(--primary-color)")}
                                    onMouseLeave={(e) => (e.currentTarget.style.color = "")}
                                >
                                    {detail.productTitle}
                                </h6>
                                <small className="text-muted d-block mb-2">
                                    {detail.marketName}
                                </small>

                                <div className="my-3 border-top border-bottom py-3">
                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                        <span className="text-muted">수량</span>
                                        <span className="fw-bold">{detail.quantity}개</span>
                                    </div>
                                    <div className="d-flex justify-content-between align-items-center">
                                        <span className="text-muted">단가</span>
                                        <span className="fw-bold">
                                            {(detail.totalPrice / detail.quantity).toLocaleString()}원
                                        </span>
                                    </div>
                                </div>

                                <div className="d-flex justify-content-between align-items-center pt-2">
                                    <span className="fw-bold">소계</span>
                                    <span className="text-primary fw-bold fs-6">
                                        {detail.totalPrice.toLocaleString()}원
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <RecentlyViewedProducts/>
        </div>
    );
}

export default OrderDetailPage;
