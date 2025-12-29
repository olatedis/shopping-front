import {useCallback, useEffect, useMemo, useState} from "react";
import Swal from "sweetalert2";
import {useNavigate} from "react-router-dom";
import {Pagination} from "react-bootstrap";
import api from "../../api/axiosInstance.ts";
import axios from "axios";

type ProductStatus = "ON_SALE" | "SOLD_OUT";

interface Product {
    id: number;
    marketId: number;
    categoryId: number;
    imgId: number;
    imageName: string;

    productTitle: string;
    status: ProductStatus;
    sellPrice: number;
    viewCount: number;
    productDesc: string;
    createDate: string;

    marketName?: string;
    category?: string;
}

type Category = {
    id: number;
    category: string;
    parentId: number | null;
    depth: number | null;
};

// 1) form에 imgId, imageName 추가
interface ProductForm {
    productTitle: string;
    categoryId: number;
    sellPrice: number;
    status: ProductStatus;
    productDesc: string;
    imgId?: number | null;
    imageName?: string | null;
}


// ===========components====================
const SellerProductPage = () => {
    const navigate = useNavigate();

    // ========== state ==========
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);


    const [currentPage, setCurrentPage] = useState(1);
    const [totalPage, setTotalPage] = useState(0);
    const [startPage, setStartPage] = useState(1);
    const [endPage, setEndPage] = useState(1);

    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);

    const [form, setForm] = useState<ProductForm>({
        productTitle: "",
        categoryId: 0,
        sellPrice: 0,
        status: "ON_SALE",
        productDesc: "",
        imgId: null,
        imageName: null,
    });


    const [parentCategoryId, setParentCategoryId] = useState<number | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    // ========== computed ==========
    const depth1Categories = useMemo(() => {
        return categories.filter((c) => c.depth === 1);
    }, [categories]);

    const depth2Categories = useMemo(() => {
        return categories.filter(
            (c) => c.depth === 2 && c.parentId === parentCategoryId
        );
    }, [categories, parentCategoryId]);

    // ========== API calls ==========
    const fetchProducts = useCallback(async (page: number) => {
        try {
            // ✅ SELLER API 엔드포인트로 변경
            const res = await api.get(`/api/seller/product/showAll/${page}`);
            const data = res.data;
            setProducts(data.items || []);
            setTotalPage(data.totalPage || 0);
            setStartPage(data.startPage || 1);
            setEndPage(data.endPage || 1);
            setCurrentPage(page);
        } catch (err) {
            console.error(err);
            Swal.fire("오류", "상품 목록을 불러오는 데 실패했습니다.", "error");
        }
    }, []);

    const fetchCategories = useCallback(async () => {
        try {
            // ✅ SELLER API 엔드포인트로 변경
            const res = await api.get("/api/seller/product/categories");
            setCategories(res.data);
        } catch (err) {
            console.error(err);
        }
    }, []);

    useEffect(() => {
        fetchProducts(1);
        fetchCategories();
    }, [fetchCategories, fetchProducts]);

    // ========== handlers ==========
    const handleFormChange = (
        e: React.ChangeEvent<
            HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >
    ) => {
        const {name, value} = e.target;
        setForm((prev) => ({
            ...prev,
            [name]: name === "sellPrice" || name === "categoryId" ? Number(value) : value,
        }));
    };

    // 2) 이미지 업로드 핸들러를 관리자 스타일로 변경
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("file", file);

        const token = localStorage.getItem("logIn");
        if (!token) {
            await Swal.fire("경고", "로그인 후 이미지를 업로드할 수 있습니다.", "warning");
            return;
        }

        try {
            // 실제 파일 업로드
            const uploadResp = await axios.post(
                "http://localhost:8080/api/upload",
                formData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const fileName = uploadResp.data; // 서버가 돌려준 파일명

            // img 테이블 row 생성 + imgId 반환
            const imgResp = await axios.post(
                "http://localhost:8080/api/product/upload/img",
                fileName,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const newImgId = imgResp.data;

            // form에 세팅
            setForm(prev => ({
                ...prev,
                imgId: newImgId,
                imageName: fileName,
            }));

            // 프리뷰 이미지도 서버 URL 기준으로
            setPreview(`http://localhost:8080/images/${fileName}`);

            await Swal.fire("성공", "이미지를 업로드했습니다.", "success");
        } catch (err) {
            console.error(err);
            await Swal.fire("오류", "이미지 업로드에 실패했습니다.", "error");
        }
    };


    // 3) handleSubmit에서는 이미지 업로드 다시 하지 말고,
//    form에 이미 들어있는 imgId만 보내기
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (form.categoryId === 0) {
            await Swal.fire("입력 오류", "2차 카테고리를 선택해주세요.", "warning");
            return;
        }

        try {
            const payload = {
                ...form,
                // marketId는 백엔드에서 로그인 셀러 기준으로 자동 세팅
            };

            if (editing && editingId !== null) {
                await api.post(`/api/seller/product/update/${editingId}`, payload);
                await Swal.fire("성공", "상품이 수정되었습니다.", "success");
            } else {
                await api.post("/api/seller/product", payload);
                await Swal.fire("성공", "상품이 등록되었습니다.", "success");
            }

            setFormOpen(false);
            resetForm();
            await fetchProducts(currentPage);
        } catch (err: any) {
            console.error(err);
            const msg =
                err.response?.data?.message || "상품 처리 중 오류가 발생했습니다.";
            await Swal.fire("오류", msg, "error");
        }
    };


    const resetForm = () => {
        setForm({
            productTitle: "",
            categoryId: 0,
            sellPrice: 0,
            status: "ON_SALE",
            productDesc: "",
            imgId: null,
            imageName: null,
        });
        setParentCategoryId(null);
        setEditing(false);
        setEditingId(null);
        setPreview(null);
    };


    const handleEditProduct = async (productId: number) => {
        try {
            const res = await api.get(`/api/seller/product/${productId}`);
            const p = res.data;

            console.log(p)
            const cat = categories.find((c) => c.id === p.categoryId);
            setParentCategoryId(cat?.parentId ?? null);

            setForm({
                productTitle: p.productTitle,
                categoryId: p.categoryId,
                sellPrice: p.sellPrice,
                status: p.status,
                productDesc: p.productDesc,
                imgId: p.imgId ?? null,
                imageName: p.image ?? null,
            });

            // ✅ 기존 이미지 프리뷰 세팅
            if (p.image) {
                // 실제 이미지 서빙 URL에 맞게 수정 필요
                console.log(p.image)
                setPreview(`http://localhost:8080/images/${p.image.replace('=', '')}`);
            } else {
                setPreview(null);
            }

            setEditing(true);
            setEditingId(productId);
            setFormOpen(true);
        } catch (err) {
            console.error(err);
            await Swal.fire("오류", "상품 정보를 불러오는 데 실패했습니다.", "error");
        }
    };


    const handleDeleteProduct = async (productId: number) => {
        const result = await Swal.fire({
            title: "정말 삭제하시겠습니까?",
            text: "이 작업은 되돌릴 수 없습니다.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "삭제",
            cancelButtonText: "취소",
        });

        if (!result.isConfirmed) return;

        try {
            // ✅ SELLER API 엔드포인트로 변경
            await api.post(`/api/seller/product/delete/${productId}`);
            await Swal.fire("삭제 완료", "상품이 삭제되었습니다.", "success");
            await fetchProducts(currentPage);
        } catch (err) {
            console.error(err);
            await Swal.fire("오류", "상품 삭제 중 오류가 발생했습니다.", "error");
        }
    };

    const handleStatusToggle = async (productId: number, currentStatus: ProductStatus) => {
        const newStatus: ProductStatus = currentStatus === "ON_SALE" ? "SOLD_OUT" : "ON_SALE";
        try {
            // ✅ SELLER API 엔드포인트로 변경
            await api.post(`/api/seller/product/${productId}/status`, {status: newStatus});
            await Swal.fire("변경 완료", `상품 상태가 ${newStatus === "ON_SALE" ? "판매중" : "품절"}으로 변경되었습니다.`, "success");
            await fetchProducts(currentPage);
        } catch (err) {
            console.error(err);
            await Swal.fire("오류", "상품 상태 변경 중 오류가 발생했습니다.", "error");
        }
    };

    const handlePageChange = (page: number) => {
        fetchProducts(page);
    };

    // ========== render ==========
    return (
        <div className="container mt-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h2>셀러 상품 관리</h2>
                <button
                    className="btn btn-primary"
                    onClick={() => {
                        resetForm();
                        setFormOpen(true);
                    }}
                >
                    + 신규 등록
                </button>
            </div>

            {/* 상품 목록 */}
            <div className="card mb-4">
                <div className="card-body">
                    <table className="table table-hover">
                        <thead>
                        <tr>
                            <th>#</th>
                            <th>상품명</th>
                            <th>마켓</th>
                            <th>카테고리</th>
                            <th>가격</th>
                            <th>상태</th>
                            <th>조회수</th>
                            <th>등록일</th>
                            <th>관리</th>
                        </tr>
                        </thead>
                        <tbody>
                        {products.length === 0 ? (
                            <tr>
                                <td colSpan={9} className="text-center">
                                    등록된 상품이 없습니다.
                                </td>
                            </tr>
                        ) : (
                            products.map((p) => (
                                <tr key={p.id}>
                                    <td>{p.id}</td>
                                    <td
                                        style={{cursor: "pointer", color: "#3665f3", textDecoration: "underline"}}
                                        onClick={() => navigate(`/product/showOne/${p.id}`)}
                                    >
                                        {p.productTitle}
                                    </td>

                                    <td>{p.marketName}</td>
                                    <td>{p.category}</td>
                                    <td>{p.sellPrice.toLocaleString()}원</td>
                                    <td>
                                            <span
                                                className={
                                                    p.status === "ON_SALE"
                                                        ? "badge bg-success"
                                                        : "badge bg-secondary"
                                                }
                                            >
                                                {p.status === "ON_SALE" ? "판매중" : "품절"}
                                            </span>
                                    </td>
                                    <td>{p.viewCount}</td>
                                    <td>{new Date(p.createDate).toLocaleDateString()}</td>
                                    <td>
                                        <button
                                            className="btn btn-sm btn-outline-primary me-1"
                                            onClick={() => handleEditProduct(p.id)}
                                        >
                                            수정
                                        </button>
                                        <button
                                            className="btn btn-sm btn-outline-danger me-1"
                                            onClick={() => handleDeleteProduct(p.id)}
                                        >
                                            삭제
                                        </button>
                                        <button
                                            className="btn btn-sm btn-outline-secondary"
                                            onClick={() => handleStatusToggle(p.id, p.status)}
                                        >
                                            {p.status === "ON_SALE" ? "품절" : "판매"}
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                        </tbody>
                    </table>

                    {/* Pagination */}
                    {totalPage > 0 && (
                        <div className="d-flex justify-content-center mt-3">
                            <Pagination>
                                <Pagination.First onClick={() => handlePageChange(1)}/>
                                <Pagination.Prev
                                    onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                                />
                                {Array.from({length: endPage - startPage + 1}, (_, i) => startPage + i).map((page) => (
                                    <Pagination.Item
                                        key={page}
                                        active={page === currentPage}
                                        onClick={() => handlePageChange(page)}
                                    >
                                        {page}
                                    </Pagination.Item>
                                ))}
                                <Pagination.Next
                                    onClick={() => handlePageChange(Math.min(totalPage, currentPage + 1))}
                                />
                                <Pagination.Last onClick={() => handlePageChange(totalPage)}/>
                            </Pagination>
                        </div>
                    )}
                </div>
            </div>

            {/* 상품 등록/수정 폼 - 모달로 표시 */}
            {formOpen && (
                <div className="modal-backdrop" onClick={() => setFormOpen(false)}>
                    <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <h5 className="mb-0">{editing ? "상품 수정" : "신규 상품 등록"}</h5>
                            <button type="button" className="btn-close" aria-label="Close" onClick={() => setFormOpen(false)}></button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="mb-2">
                                <label className="form-label">상품명</label>
                                <input
                                    type="text"
                                    name="productTitle"
                                    value={form.productTitle}
                                    onChange={handleFormChange}
                                    className="form-control"
                                    required
                                />
                            </div>

                            <div className="mb-2">
                                <label className="form-label">이미지</label>
                                <div className="d-flex align-items-center gap-3">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        className="form-control"
                                        style={{maxWidth: "250px"}}
                                    />

                                    {preview && (
                                        <img
                                            src={preview}
                                            alt="preview"
                                            style={{
                                                width: "80px",
                                                height: "80px",
                                                objectFit: "cover",
                                                borderRadius: "8px",
                                                border: "1px solid #ddd"
                                            }}
                                        />
                                    )}
                                </div>
                            </div>

                            {/*depth1 / depth2 카테고리 */}
                            <div className="row">
                                <div className="col-6 mb-2">
                                    <label className="form-label">1차 카테고리</label>
                                    <select
                                        className="form-select"
                                        value={parentCategoryId ?? 0}
                                        onChange={(e) => {
                                            const val = Number(e.target.value);
                                            setParentCategoryId(val === 0 ? null : val);
                                            setForm((prev) => ({...prev, categoryId: 0}));
                                        }}
                                    >
                                        <option value={0}>선택</option>
                                        {depth1Categories.map((cat) => (
                                            <option key={cat.id} value={cat.id}>
                                                {cat.category} (#{cat.id})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="col-6 mb-2">
                                    <label className="form-label">2차 카테고리</label>
                                    <select
                                        name="categoryId"
                                        className="form-select"
                                        value={form.categoryId}
                                        onChange={handleFormChange}
                                        disabled={!parentCategoryId}
                                        required
                                    >
                                        <option value={0}>선택</option>
                                        {depth2Categories.map((cat) => (
                                            <option key={cat.id} value={cat.id}>
                                                {cat.category} (#{cat.id})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="mb-2">
                                <label className="form-label">가격</label>
                                <input
                                    type="number"
                                    name="sellPrice"
                                    value={form.sellPrice}
                                    onChange={handleFormChange}
                                    className="form-control"
                                    required
                                />
                            </div>

                            <div className="mb-2">
                                <label className="form-label">상태</label>
                                <select
                                    name="status"
                                    value={form.status}
                                    onChange={handleFormChange}
                                    className="form-select"
                                >
                                    <option value="ON_SALE">판매중</option>
                                    <option value="SOLD_OUT">품절</option>
                                </select>
                            </div>

                            <div className="mb-3">
                                <label className="form-label">상품 설명</label>
                                <textarea
                                    name="productDesc"
                                    value={form.productDesc}
                                    onChange={handleFormChange}
                                    className="form-control"
                                    rows={4}
                                />
                            </div>

                            <div className="d-flex justify-content-end gap-2">
                                <button
                                    type="button"
                                    className="btn btn-outline-secondary"
                                    onClick={() => setFormOpen(false)}
                                >
                                    닫기
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    {editing ? "저장" : "등록"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SellerProductPage;
