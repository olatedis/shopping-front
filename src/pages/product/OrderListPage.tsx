import {useEffect, useState} from "react";
import axios from "axios";
import {useNavigate} from "react-router-dom";
import RecentlyViewedProducts from "../product/RecentlyViewedProducts";
import Swal from "sweetalert2";


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
};

// 주문 상태 한글 라벨
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

// 상태에 따른 Badge 클래스
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

const OrderListPage = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const navigate = useNavigate();
    const [id, setId] = useState<number | null>(null);

    // 로그인한 사용자 정보 가져오기
    useEffect(() => {
        const fetchMyInfo = async () => {
            const token = localStorage.getItem("logIn");
            if (!token) {
                Swal.fire({ icon: "warning", title: "로그인 필요", text: "로그인이 필요합니다." }).then(() => navigate("/user/login"));
                return;
            }

            try {
                const response = await axios.get(
                    "http://localhost:8080/api/member/me",
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                const data = response.data;
                setId(data.id);
            } catch (e) {
                console.error(e);
            }
        };

        fetchMyInfo();
    }, []);

    // 내 주문 목록 불러오기
    useEffect(() => {
        if (id === null) return;

        const fetchMyOrders = async () => {
            const token = localStorage.getItem("logIn");
            if (!token) return;

            try {
                const res = await axios.get(
                    `http://localhost:8080/api/order/myOrder/${id}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );
                setOrders(res.data);
            } catch (e) {
                console.error(e);
            }
        };

        fetchMyOrders();
    }, [id]);

    const formatDate = (date: string) => {
        const d = new Date(date);
        return d.toLocaleString("ko-KR");
    };

    return (
        <div className="container py-4">
            <h2 className="mb-4 fw-bold">주문 목록</h2>

            {orders.length === 0 ? (
                <div className="alert alert-info text-center py-5">
                    주문 내역이 없습니다.
                </div>
            ) : (
                <div className="row g-3">
                    {orders.map((order) => (
                        <div key={order.id} className="col-md-6 col-lg-4">
                            <div
                                className="card h-100 shadow-sm border-0 cursor-pointer"
                                onClick={() =>
                                    navigate(`/product/orderdetail/${order.id}`)
                                }
                                style={{ cursor: "pointer", transition: "all 0.3s ease" }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = "translateY(-4px)";
                                    e.currentTarget.style.boxShadow = "0 8px 25px rgba(184, 166, 255, 0.2)";
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = "translateY(0)";
                                    e.currentTarget.style.boxShadow = "0 0.125rem 0.25rem rgba(0, 0, 0, 0.075)";
                                }}
                            >
                                <div className="card-body">
                                    <div className="d-flex justify-content-between align-items-start mb-3">
                                        <div>
                                            <h6 className="card-title fw-bold text-dark mb-1">
                                                주문번호: {order.id}
                                            </h6>
                                            <small className="text-muted d-block">
                                                {formatDate(order.orderDate)}
                                            </small>
                                        </div>
                                        <span className={getStatusBadgeClass(order.status)}>
                                            {STATUS_LABELS[order.status] || order.status}
                                        </span>
                                    </div>

                                    <div className="border-top pt-3">
                                        <div className="d-flex justify-content-between align-items-center">
                                            <span className="text-muted">결제금액</span>
                                            <span className="fw-bold text-primary fs-6">
                                                {order.totalPrice.toLocaleString()}원
                                            </span>
                                        </div>
                                    </div>

                                    <div className="mt-3">
                                        <small className="text-muted">
                                            수령인: {order.receiverName}
                                        </small>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            <RecentlyViewedProducts/>
        </div>
    );
};

export default OrderListPage;
