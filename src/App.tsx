
import  "./App.css"
import LogInPage from "./pages/user/LogInPage.tsx";
import {BrowserRouter, Route, Routes} from "react-router-dom";
import RegisterPage from "./pages/user/RegisterPage.tsx";
import ProfilePage from "./pages/user/ProfilePage.tsx";
import ShowAllProductsPage from "./pages/product/ShowAllProductsPage.tsx";
import ShowOneProductPage from "./pages/product/ShowOneProductPage.tsx";
import "bootswatch/dist/lumen/bootstrap.min.css"
import Header from "./pages/header/Header.tsx";
import WishListPage from "./pages/product/WishListPage.tsx";
import CartPage from "./pages/product/CartPage.tsx";
import ManageMemberPage from "./pages/admin/ManageMemberPage.tsx";
import PaymentPage from "./pages/product/paymentPage.tsx";
import ManageOrdersPage from "./pages/admin/ManageOrdersPage.tsx";
import ManageMarketPage from "./pages/admin/ManageMarketPage.tsx";
import OrderListPage from "./pages/product/OrderListPage.tsx";
import OrderDetailPage from "./pages/product/OrderDetailPage.tsx";
import SellerProductPage from "./pages/seller/SellerProductPage.tsx";
import ManageProductPage from "./pages/admin/ManageProductPage.tsx";

function App() {

  return (
    <> <BrowserRouter>
        <Header/>
        <Routes>
            <Route path="/" element={<LogInPage/>}/>
            <Route path='/user/register' element={<RegisterPage/>}/>
            <Route path='/user/myPage' element={<ProfilePage/>}/>
            <Route path='/product/list' element={<ShowAllProductsPage/>}/>
            <Route path='/product/showOne/:id' element={<ShowOneProductPage/>}/>
            <Route path='/product/wishlist' element={<WishListPage/>}/>
            <Route path='/product/cart' element={<CartPage/>}/>
            <Route path="/admin/member" element={<ManageMemberPage/>}/>
            <Route path="/admin/product/showAll" element={<ManageProductPage/>}/>
            <Route path="/product/payment" element={<PaymentPage/>}/>
            <Route path="/admin/orders" element={<ManageOrdersPage/>}/>
            <Route path="/admin/market" element={<ManageMarketPage/>}/>
            <Route path="/product/orderlist" element={<OrderListPage/>}/>
            <Route path="/product/orderdetail/:orderId" element={<OrderDetailPage/>} />
            <Route path="/seller/product/showAll" element={<SellerProductPage/>}/>
        </Routes>
    </BrowserRouter>
    </>
  )
}

export default App
