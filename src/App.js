import styles from "./App.module.css";
import { Navbar } from "./components/navbar/Navbar";
import { AlbumsList } from "./components/albumsList/AlbumsList";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function App() {
  return (
    <div className={styles.App}>
      <ToastContainer />
      <Navbar />
      <div className={styles.content}>
        <AlbumsList />
      </div>
    </div>
  );
}

export default App;
