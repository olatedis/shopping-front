// src/components/AdminMenu.tsx
import {FC} from "react";
import {useNavigate} from "react-router-dom";
import {NavDropdown} from "react-bootstrap";

type AdminMenuProps = {
    role?: string;
};

const AdminMenu: FC<AdminMenuProps> = ({ role }) => {
    const navigate = useNavigate();

    // ADMIN 아닌 경우 아예 안 보이게
    if (!role || !role.includes("ADMIN")) {
        return null;
    }

    return (
        <NavDropdown title="관리자" id="admin-menu">
            <NavDropdown.Item onClick={() => navigate("/admin/member")}>
                멤버 관리
            </NavDropdown.Item>
            <NavDropdown.Item onClick={() => navigate("/admin/product/showAll")}>
                상품 관리
            </NavDropdown.Item>
            <NavDropdown.Item onClick={() => navigate("/admin/market")}>
                마켓 관리
            </NavDropdown.Item>
            <NavDropdown.Item onClick={() => navigate("/admin/orders")}>
                주문 관리
            </NavDropdown.Item>
        </NavDropdown>
    );
};

export default AdminMenu;
