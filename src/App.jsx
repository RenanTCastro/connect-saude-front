import { RouterProvider } from "react-router-dom";
import { ConfigProvider } from "antd";
import { themeConfig } from "./themeConfig";
import router from "./Routes";

export default function App() {
  return (
    <ConfigProvider theme={themeConfig}>
      <RouterProvider router={router} />
    </ConfigProvider>
  );
}
