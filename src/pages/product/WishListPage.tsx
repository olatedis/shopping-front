import {useEffect, useState} from "react";
import axios from "axios";
import {Link, useNavigate} from "react-router-dom";
import Swal from "sweetalert2";


type Product = {
    id: number;
    title: string;
    status: string;
    marketName: string;
    marketLink: string;
    category: string;
    sellPrice: number;
    viewCount: number;
    wishCount: number;
    productDesc: string;
    image: string;
    createDate: string;
};


const WishListPage = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const navigate = useNavigate();
    const [id, setId] = useState();
    const token = localStorage.getItem('logIn');

    const DEFAULT_IMAGE = "http://localhost:8080/images/animated-icon-loading-19021458.gif";

    // user.id 가져오기
    useEffect(() => {

        if (!token) {
            Swal.fire({ icon: "warning", title: "로그인 필요", text: "로그인이 필요합니다." });
            navigate('/');
            return;
        }

        axios.get('http://localhost:8080/api/member/me', {
            headers: {Authorization: `Bearer ${token}`}
        }).then(res => {
            setId(res.data.id);
        }).catch(e => console.error(e));
    }, []);

// id가 세팅된 뒤에 wishlist 요청
    useEffect(() => {
        if (!id) return;  // id가 없으면 실행하지 않음

        axios.get(`http://localhost:8080/api/product/wishlist/${id}`, {
            headers: {Authorization: `Bearer ${token}`},
        })
            .then(res => setProducts(res.data))
            .catch(e => console.error(e));
    }, [id, products]);
    //
    // const deleteProduct = (id: number) => {
    //
    //     axios.get(`http://localhost:8080/api/product/wish/${id}`, {
    //         headers: {Authorization: `Bearer ${token}`}
    //     })
    // }

    const addToCart = (product: Product) => {
        // 품절 상품 확인
        if (product.status === "SOLD_OUT") {
            Swal.fire({ icon: "error", title: "품절", text: "품절된 상품은 장바구니에 담을 수 없습니다." });
            return;
        }

        const token = localStorage.getItem("logIn");
        if (!token) {
            Swal.fire({ icon: "warning", title: "로그인 필요", text: "로그인이 필요합니다." });
            return;
        }

            const cart = {
                memberId: id,
                productId: product.id,
                quantity: 1
            }
            axios.post("http://localhost:8080/api/cart/insertCart", cart, {
                headers: {Authorization: `Bearer ${token}`},
            }).then(() => {
                Swal.fire({ icon: "success", title: "완료", text: "장바구니에 담았습니다." });
            });
    };

    return (
        <div className="container py-4">
            <h2 className="mb-4">찜 목록</h2>

            {products.length === 0 ? (
                <div className="text-center text-muted py-5">찜한 상품이 없습니다.</div>
            ) : (
                <div className="row g-4">
                    {products.map((p) => (
                        <div key={p.id} className="col-md-6 col-lg-3">
                            <div className="card h-100 shadow-sm border-0">
                                <div style={{height: "200px", overflow: "hidden", borderRadius: "0.75rem 0.75rem 0 0"}}>
                                    <img
                                        src={
                                            p.image
                                                ? `http://localhost:8080/images/${p.image.replace('=', '')}`
                                                : DEFAULT_IMAGE
                                        }
                                        alt={p.title}
                                        style={{width: "100%", height: "100%", objectFit: "cover"}}
                                    />
                                </div>
                                <div className="card-body d-flex flex-column">
                                    <Link to={`/product/showOne/${p.id}`} style={{textDecoration: "none"}}>
                                        <h5 className="card-title text-dark">{p.title}</h5>
                                    </Link>
                                    <p className="text-primary fw-bold mb-3">{p.sellPrice.toLocaleString()}원</p>
                                    <div className="d-flex gap-2 mt-auto">
                                        <button 
                                            onClick={() => addToCart(p)}
                                            className="btn btn-sm btn-primary w-100 rounded-pill"
                                            disabled={p.status === "SOLD_OUT"}
                                        >
                                            {p.status === "SOLD_OUT" ? "품절됨" : "장바구니 추가"}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
export default WishListPage