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
    image: string;


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
type Market = {
    id: number;
    marketName: string;
};

// ProductForm removed (not used)

// ===========components====================
const ManageProductPage = () => {
    const navigate = useNavigate();

    const [products, setProducts] = useState<Product[]>([]);
    const [selectedId, setSelectedId] = useState<number | null>(null);

    const [markets, setMarkets] = useState<Market[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const maxDepth = categories.length ? Math.max(...categories.map(c => c.depth ?? 0)) : 0;
    // prevent unused variable TS errors
    void maxDepth;


    const [searchKeyword, setSearchKeyword] = useState("");
    const [statusFilter, setStatusFilter] = useState<"ALL" | ProductStatus>("ALL");

    // 이미지 저장
    const [image, setImageName] = useState("");
    const [imageId, setImageId] = useState(0);
    const [preview, setPreview] = useState<string | null>(null);

    const [totalPage, setTotalPage] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [startPage, setStartPage] = useState(1);
    const [endPage, setEndPage] = useState(1);
// 폼 상태 (등록/수정 공용)
    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<Product | null>(null);
    const [formMode, setFormMode] = useState<"VIEW" | "EDIT">("EDIT");
    const [form, setForm] = useState({
        productTitle: "",
        marketId: 0,
        categoryId: 0,
        sellPrice: 0,
        status: "ON_SALE" as ProductStatus,
        productDesc: "",
        imgId: imageId,
        image: image
    });
    const depthGroups = useMemo(() => {
        const groups: { [key: number]: Category[] } = {};
        categories.forEach(c => {
            const d = c.depth ?? 0;
            if (!groups[d]) groups[d] = [];
            groups[d].push(c);
        });
        return groups;
    }, [categories]);
    // prevent unused variable TS errors
    void depthGroups;

    const [parentCategoryId, setParentCategoryId] = useState<number | null>(null);
    // ========drompdown headers============
    const depth1Categories = useMemo(
        () => categories.filter((c) => c.depth === 1),
        [categories]
    );
    const depth2Categories = useMemo(
        () => categories.filter((c) => c.depth === 2 && c.parentId === parentCategoryId),
        [categories, parentCategoryId]
    );
    const getMarketLabel = (marketId: number) => {
        const m = markets.find((m) => m.id === marketId);
        return m ? `${m.marketName}(#${m.id}` : `#${marketId}`;
    }
    const getCategoryLabel = (categoryId: number) => {
        const c = categories.find((c) => c.id === categoryId);
        if (!c) return `#${categoryId}`;
        if (c.depth === 1) {
            return c.category;
        }

        const parent = categories.find((p) => p.id === c.parentId);
        return parent ? `${parent.category}>${c.category}` : c.category;

    }
    // ===============

    const selectedProduct = useMemo(
        () =>
            Array.isArray(products)
                ? products.find((p) => p.id === selectedId) ?? null
                : null,
        [products, selectedId]
    );
    // prevent unused variable TS errors
    void selectedProduct;

    const fetchPage = useCallback(async (page: number): Promise<void> => {
        if (page < 1) {
            return;
        }

        const token = localStorage.getItem("logIn");
        if (!token) {
            Swal.fire({icon: "warning", title: "로그인 필요", text: "로그인이 필요합니다."});
            navigate("/");
            return;
        }

        try {
            const resp = await api.get(`/api/admin/product/showAll/${page}`);
            const data = resp.data;
            const list = Array.isArray(data.items) ? data.items : [];
            setProducts(list);

            // if (page === 1 && list.length > 0 && selectedId === null) {
            //     setSelectedId(list[0].id);
            // }

            setTotalPage(data.totalPage || 0);
            setCurrentPage(data.currentPage);
            setStartPage(data.startPage);
            setEndPage(data.endPage);

        } catch (err: any) {
            console.error(err);
            if (err.response?.status === 403) {
                Swal.fire({icon: "error", title: "권한 없음", text: "관리자만 접근할 수 있는 페이지입니다."});
                navigate("/");
            } else if (err.response?.status === 404) {
                setProducts([]);
                setTotalPage(0);
            } else {
                Swal.fire({icon: "error", title: "오류", text: "상품 목록을 불러오지 못했습니다."});
            }
        }

    }, [navigate]);

    useEffect(() => {
        fetchPage(1);
    }, [fetchPage]);

    useEffect(() => {
        const fetchDropdownData = async () => {
            try {
                const [resMarket, resCategory] = await Promise.all([
                    api.get<Market[]>("/api/admin/product/markets"),
                    api.get<Category[]>("/api/admin/product/categories"),
                ]);
                setMarkets(resMarket.data);
                setCategories(resCategory.data);
            } catch (err) {
                console.error(err);
            }
        };

        fetchDropdownData();
    }, []);
    useEffect(() => {
        if (!editing || categories.length === 0) return;

        const currentCat = categories.find((c) => c.id === editing.categoryId);
        if (!currentCat) return;

        if (currentCat.depth === 1) {
            setParentCategoryId(currentCat.id);
        } else if (currentCat.depth === 2 && currentCat.parentId) {
            setParentCategoryId(currentCat.parentId);
        }
    }, [editing, categories]);
    useEffect(() => {
        if (!form.categoryId || categories.length === 0) return;

        const currentCat = categories.find((c) => c.id === form.categoryId);
        if (!currentCat) return;

        // depth=1 이면 자기 자신이 1차
        if (currentCat.depth === 1) {
            setParentCategoryId(currentCat.id);
            return;
        }

        // depth=2 이상이면 parentId 가 1차
        if (currentCat.parentId) {
            setParentCategoryId(currentCat.parentId);
        }
    }, [form.categoryId, categories]);

    const renderPagination = () => {
        if (!totalPage || totalPage <= 1) {
            return null;
        }

        const pages = [];
        const realEndPage = Math.min(endPage, totalPage);
        for (let i = startPage; i <= realEndPage; i++) {
            pages.push(
                <Pagination.Item
                    key={i}
                    active={i === currentPage}
                    onClick={() => fetchPage(i)}
                >
                    {i}
                </Pagination.Item>
            );
        }

        return (
            <div className="d-flex justify-content-center mt-3">
                <Pagination>
                    <Pagination.First onClick={() => fetchPage(1)} disabled={currentPage === 1}/>
                    <Pagination.Prev onClick={() => fetchPage(currentPage - 1)} disabled={currentPage <= 1}/>
                    {pages}
                    <Pagination.Next onClick={() => fetchPage(currentPage + 1)} disabled={currentPage >= totalPage}/>
                    <Pagination.Last onClick={() => fetchPage(totalPage)}
                                     disabled={!totalPage || currentPage === totalPage}/>
                </Pagination>
            </div>
        );
    };


    const filteredProducts = useMemo(() => {
        return products.filter((p) => {
            const keyword = searchKeyword.trim();
            const keywordHit =
                !keyword ||
                p.productTitle.includes(keyword) ||
                (p.marketName ?? "").includes(keyword) ||
                (p.category ?? "").includes(keyword);

            const statusHit =
                statusFilter === "ALL" ? true : p.status === statusFilter;

            return keywordHit && statusHit;
        });
    }, [products, searchKeyword, statusFilter]);
    // ========handlers
    const handleFormChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const {name, value} = e.target;
        setForm((prev) => ({
            ...prev,
            [name]:
                name === "marketId" || name === "categoryId" || name === "sellPrice"
                    ? Number(value)
                    : value,
        }));
    };
    const openCreateForm = () => {
        setEditing(null);
        setFormMode("EDIT");
        setParentCategoryId(null);
        setPreview(null); // 미리보기 초기화
        setForm({
            imgId: 0,
            image: "",
            productTitle: "",
            marketId: 0,
            categoryId: 0,
            sellPrice: 0,
            status: "ON_SALE",
            productDesc: "",
        });
        setFormOpen(true);
    };

    const openViewForm = (product: Product) => {
        setEditing(product);
        setForm({
            imgId: product.imgId,
            image: product.image,
            productTitle: product.productTitle,
            marketId: product.marketId,
            categoryId: product.categoryId,
            sellPrice: product.sellPrice,
            status: product.status,
            productDesc: product.productDesc
        });
        setFormMode("VIEW");
        setFormOpen(true);
    };
    // prevent unused function TS errors
    void openViewForm;
    const handleCancel = () => {
        if (editing) {
            //cancel editing, go back to the original+view mode
            setForm({
                imgId: editing.imgId,
                image: editing.image,
                productTitle: editing.productTitle,
                marketId: editing.marketId,
                categoryId: editing.categoryId,
                sellPrice: editing.sellPrice,
                status: editing.status,
                productDesc: editing.productDesc,
            });
            setFormMode("VIEW");
        } else {
            setFormOpen(false);
        }
    };
    // prevent unused function TS errors
    void handleCancel;

    const submitForm = async (e: React.FormEvent) => {
        e.preventDefault();
        // 🔥 1차 카테고리 선택 여부 체크
        if (!parentCategoryId || parentCategoryId === 0) {
            await Swal.fire({
                icon: "warning",
                title: "카테고리 선택",
                text: "1차 카테고리를 먼저 선택해주세요.",
            });
            return;
        }
        // 🔥 2차(마지막) 카테고리 선택 여부 체크
        if (!form.categoryId || form.categoryId === 0) {
            await Swal.fire({
                icon: "warning",
                title: "카테고리 선택",
                text: "마지막 카테고리(2차)까지 모두 선택해주세요.",
            });
            return;
        }
        try {
            if (editing) {
                // debug removed
                const resp = await api.post<Product>(
                    `api/admin/product/update/${editing.id}`,
                    form
                );
                const updated = resp.data;
                setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
                setSelectedId(updated.id);
                Swal.fire("수정 완료", "상품 정보를 수정했습니다", "success");
            } else {
                // debug removed
                const resp = await api.post<Product>(
                    "/api/admin/product",
                    form
                );
                const created = resp.data;
                setProducts((prev) => [created, ...prev]);
                setSelectedId(created.id);
                Swal.fire("등록완료", "새 상품을 등록했습니다", "success");
            }
            setFormOpen(false);
        } catch (err) {
            console.error(err);
            Swal.fire("오류", "상품 저장에 실패했습니다", "error");
        }
    };


    const openEditForm = (product: Product) => {
        setEditing(product);
        setForm({
            imgId: product.imgId,
            image: product.image,
            productTitle: product.productTitle,
            marketId: product.marketId,
            categoryId: product.categoryId,
            sellPrice: product.sellPrice,
            status: product.status,
            productDesc: product.productDesc,
        });
        setImageName(product.image);
        setImageId(product.imgId);
        // 기존 이미지 미리보기 설정
        if (product.image) {
            setPreview(`http://localhost:8080/images/${product.image.replace('=', '')}`);
        }
        setFormOpen(true);
    };


    const deleteProduct = async (id: number) => {
        const target = products.find((p) => p.id === id);
        if (!target) return;
        const result = await Swal.fire({
            title: "상품 삭제",
            text: `"${target.productTitle}" 상품을 삭제할까요? 이 작업은 되돌릴 수 없습니다.`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "삭제",
            cancelButtonText: "취소",
            confirmButtonColor: "#d33",
        });
        if (!result.isConfirmed) return;
        try {
            await api.post(`/api/admin/product/delete/${id}`);
            setProducts((prev) => prev.filter((p) => p.id !== id));
            if (selectedId === id) {
                setSelectedId(null);
            }
            Swal.fire("삭제 완료", "상품을 삭제했습니다.", "success");
        } catch (err) {
            console.error(err);
            Swal.fire("오류", "상품 삭제에 실패했습니다.", "error")
        }
    }

    const toggleStatus = async (id: number) => {
        const target = products.find((p) => p.id === id);
        if (!target) return;

        const nextStatus: ProductStatus =
            target.status === "ON_SALE" ? "SOLD_OUT" : "ON_SALE";

        const result = await Swal.fire({
            title:
                nextStatus === "SOLD_OUT"
                    ? "품절 처리하시겠어요?"
                    : "다시 판매중으로 변경할까요?",
            text: `"${target.productTitle}" 상태를 변경합니다.`,
            icon: "question",
            showCancelButton: true,
            confirmButtonText: "예",
            cancelButtonText: "취소",
        });

        if (!result.isConfirmed) return;

        try {
            const resp = await api.post<Product>(
                `/api/admin/product/${id}/status`,
                {status: nextStatus}
            );
            const updated = resp.data;
            setProducts((prev) =>
                prev.map((p) => (p.id === updated.id ? updated : p))
            );
            if (selectedId === id) {
                setSelectedId(id);
            }
            Swal.fire("변경 완료", "상품 상태를 변경했습니다.", "success");
        } catch (err) {
            console.error(err);
            Swal.fire("오류", "상태 변경에 실패했습니다.", "error");
        }
    };

    const getStatusBadge = (status: ProductStatus) => {
        if (status === "ON_SALE") {
            return (
                <span className="badge rounded-pill bg-success-subtle text-success">
          판매중
        </span>
            );
        }
        return (
            <span className="badge rounded-pill bg-secondary">
        품절
      </span>
        );
    };


    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        const formData = new FormData();
        if (!file) return;
        formData.append("file", file);

        try {
            // debug removed
            const token = localStorage.getItem("logIn");
            const resp = await axios.post("http://localhost:8080/api/upload", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                    Authorization: `Bearer ${localStorage.getItem("logIn")}`
                },
            });

            setImageName(resp.data); // 서버에서 받은 파일명
            // debug removed
            const imageId = await axios.post("http://localhost:8080/api/product/upload/img", resp.data, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })
            setForm(prev => ({
                ...prev,
                imgId: imageId.data,
                image: resp.data,
            }))

            setImageId(imageId.data)
        } catch (error) {
            Swal.fire({icon: "error", title: "실패", text: "업로드 실패"});
        }
    };

    return (
        <div className="container my-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h3 className="mb-0">상품 관리</h3>
                <button className="btn btn-primary" onClick={openCreateForm}>
                    상품 등록
                </button>
            </div>

            <div className="row">
                {/* 상품 목록 - 전체 폭 */}
                <div className="col-12 mb-3">
                    <div className="card shadow-sm">
                        <div className="card-body">
                            <h5 className="card-title mb-3">상품 목록</h5>

                            {/* 필터 */}
                            <div className="row g-2 mb-3">
                                <div className="col-md-6">
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="상품명 / 카테고리 / 마켓"
                                        value={searchKeyword}
                                        onChange={(e) => setSearchKeyword(e.target.value)}
                                    />
                                </div>
                                <div className="col-md-3">
                                    <select
                                        className="form-select"
                                        value={statusFilter}
                                        onChange={(e) =>
                                            setStatusFilter(e.target.value as "ALL" | ProductStatus)
                                        }
                                    >
                                        <option value="ALL">전체</option>
                                        <option value="ON_SALE">판매중</option>
                                        <option value="SOLD_OUT">품절</option>
                                    </select>
                                </div>
                                <div className="col-md-3 d-flex justify-content-end gap-2">
                                    <button
                                        className="btn btn-outline-secondary"
                                        onClick={() => {
                                            setSearchKeyword("");
                                            setStatusFilter("ALL");
                                        }}
                                    >
                                        초기화
                                    </button>
                                </div>
                            </div>

                            {/* 테이블 */}
                            <div className="table-responsive">
                                <table className="table align-middle">
                                    <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>상품명</th>
                                        <th>카테고리</th>
                                        <th>마켓</th>
                                        <th>가격</th>
                                        <th>상태</th>
                                        <th>관리</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {filteredProducts.map((p) => (
                                        <tr key={p.id}>
                                            <td>{p.id}</td>
                                            <td>{p.productTitle}</td>
                                            <td>{p.category ?? `#${p.categoryId}`}</td>
                                            <td>{p.marketName ?? `#${p.marketId}`}</td>
                                            <td>{p.sellPrice.toLocaleString()}원</td>
                                            <td>{getStatusBadge(p.status)}</td>
                                            <td>
                                                <div className="d-flex gap-2">

                                                    <button
                                                        className="btn btn-sm btn-outline-secondary"
                                                        onClick={() => navigate(`/product/showOne/${p.id}`)}
                                                        // onClick={() => openViewForm(p)}
                                                    >
                                                        보기
                                                    </button>


                                                    <button
                                                        className="btn btn-sm btn-outline-primary"
                                                        onClick={() => openEditForm(p)}
                                                    >
                                                        수정
                                                    </button>
                                                    <button
                                                        className="btn btn-sm btn-outline-warning"
                                                        onClick={() => toggleStatus(p.id)}
                                                    >
                                                        {p.status === "ON_SALE" ? "품절" : "판매중"}
                                                    </button>
                                                    <button
                                                        className="btn btn-sm btn-danger"
                                                        onClick={() => deleteProduct(p.id)}
                                                    >
                                                        삭제
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredProducts.length === 0 && (
                                        <tr>
                                            <td colSpan={7} className="text-center text-muted">
                                                조건에 맞는 상품이 없습니다.
                                            </td>
                                        </tr>
                                    )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                {/*pagination*/}

                {renderPagination()}


            </div>

            {/* 등록/수정 폼 (간단 모달 느낌) */}
            {formOpen && (
                <div
                    className="position-fixed top-0 start-0 w-100 h-100"
                    style={{
                        backgroundColor: "rgba(0,0,0,0.3)",
                        zIndex: 1050,
                    }}
                >
                    <div
                        className="card shadow position-absolute top-50 start-50 translate-middle"
                        style={{width: "480px", maxWidth: "95vw", maxHeight: '80vh', overflow: 'hidden'}}
                    >
                        <div className="card-body" style={{overflowY: 'auto', maxHeight: '72vh', paddingRight: '1rem'}}>
                            <h5 className="card-title mb-3">
                                {editing ? "상품 수정" : "상품 등록"}
                            </h5>
                            {/* VIEW 모드 */}
                            {editing && formMode === "VIEW" ? (
                                <>
                                    <div className="mb-2">
                                        <label className="form-label d-block">상품명</label>
                                        <div>{form.productTitle}</div>
                                    </div>

                                    <div className="mb-2">
                                        <label className="form-label d-block">마켓</label>
                                        <div>{getMarketLabel(form.marketId)}</div>
                                    </div>

                                    <div className="mb-2">
                                        <label className="form-label d-block">카테고리</label>
                                        <div>{getCategoryLabel(form.categoryId)}</div>
                                    </div>

                                    <div className="mb-2">
                                        <label className="form-label d-block">가격</label>
                                        <div>{form.sellPrice.toLocaleString()}원</div>
                                    </div>

                                    <div className="mb-2">
                                        <label className="form-label d-block">상태</label>
                                        <div>{form.status === "ON_SALE" ? "판매중" : "품절"}</div>
                                    </div>

                                    <div className="mb-2">
                                        <label className="form-label d-block">상품 설명</label>
                                        <div style={{whiteSpace: "pre-wrap"}}>
                                            {form.productDesc || "-"}
                                        </div>
                                    </div>

                                    <div className="d-flex justify-content-end gap-2 mt-3">
                                        <button
                                            type="button"
                                            className="btn btn-outline-secondary"
                                            onClick={() => setFormOpen(false)}
                                        >
                                            닫기
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-primary"
                                            onClick={() => setFormMode("EDIT")}
                                        >
                                            수정하기
                                        </button>
                                    </div>
                                </>
                            ) : (

                                <form onSubmit={submitForm}>
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
                                    {/*이미지 등록 + 등록한 이미지 바로 보여주기*/}
                                    {/* 이미지 업로드 */}
                                    <div className="mb-2">
                                        <label className="form-label">상품 이미지</label>
                                        <div className="d-flex align-items-center gap-3">
                                            <input
                                                name="imageUpload"
                                                type="file"
                                                accept="image/*"
                                                onChange={handleImageUpload}
                                                // onChange={handleFormChange}
                                                className="form-control"
                                                style={{maxWidth: "250px"}}
                                            />

                                            {/* 미리보기 */}
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
                                    <div className="col-6 mb-2">
                                        <label className="form-label">마켓</label>
                                        <select
                                            name="marketId"
                                            value={form.marketId}
                                            onChange={handleFormChange}
                                            className="form-select"
                                            required
                                        >
                                            <option value={0}>마켓 선택</option>
                                            {markets.map((m) => (
                                                <option key={m.id} value={m.id}>
                                                    {m.marketName} (#{m.id})
                                                </option>
                                            ))}
                                        </select>
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
                                </form>)}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageProductPage;

