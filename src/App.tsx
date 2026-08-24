import { BrowserRouter, Route, Routes } from "react-router-dom"
import { HomePage } from "./pages/HomePage"
import { OrderPage } from "./pages/OrderPage"
import { CheckoutPage } from "./pages/CheckoutPage"
import { ConfirmationPage } from "./pages/ConfirmationPage"
import { LoginPage } from "./pages/LoginPage"
import { OrdersPage } from "./pages/OrdersPage"
import { Header } from "./components/Header"
import { Footer } from "./components/Footer"

function App() {

    return (
    <BrowserRouter>
      <div className="flex min-h-screen flex-col">
        <Header></Header>
        <div className="flex-1">
          <Routes>
            <Route path="/" element={<HomePage></HomePage>}></Route>
            <Route path="/order" element={<OrderPage></OrderPage>}></Route>
            <Route path="/checkout" element={<CheckoutPage></CheckoutPage>}></Route>
            <Route path="/confirmation" element={<ConfirmationPage></ConfirmationPage>}></Route>
            <Route path="/login" element={<LoginPage></LoginPage>}></Route>
            <Route path="/orders" element={<OrdersPage></OrdersPage>}></Route>
          </Routes>
        </div>
        <Footer></Footer>
      </div>
    </BrowserRouter>
  )

}

export default App
