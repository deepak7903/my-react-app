import styles from "./albumsList.module.css";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import Spinner from "react-spinner-material";

// firebase imports
import {
  collection,
  getDocs,
  addDoc,
  Timestamp,
  query,
  orderBy,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../../firebase";
import { doc} from "firebase/firestore";
// components imports
import { AlbumForm } from "../albumForm/AlbumForm";
import { ImagesList } from "../imagesList/ImagesList";
import { PhotoUploader } from "../photoUploader/PhotoUploader";
import { GalleryGrid } from "../galleryGrid/GalleryGrid";

export const AlbumsList = () => {
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(false);
 
  const [albumAddLoading, setAlbumAddLoading] = useState(false);
  const getAlbums = async () => {
    setLoading(true);
    const albumsRef = collection(db, "albums");
    const albumsSnapshot = await getDocs(
      query(albumsRef, orderBy("created", "desc"))
    );

    const albumsData = albumsSnapshot.docs.map((doc) =>({
      id: doc.id,
      ...doc.data(),
    }));

    setAlbums(albumsData);
    setLoading(false);
  };

  
  useEffect(() => {
    getAlbums();
  }, []);

  const handleAdd = async (name) => {
    if (albums.find((a) => a.name === name))
      return toast.error("Album name already in use.");
    setAlbumAddLoading(true);
    const albumRef = await addDoc(collection(db, "albums"), {
      name,
      created: Timestamp.now(),
    });
    console.log();
    setAlbums((prev) => [{ id: albumRef.id, name }, ...prev]);
    setAlbumAddLoading(false);
    toast.success("Album added successfully.");
  };

  const [createAlbumIntent, setCreateAlbumIntent] = useState(false);
  const [activeAlbum, setActiveAlbum] = useState(null);

  const handleClick = (name) => {
    if (activeAlbum === name) return setActiveAlbum(null);
    setActiveAlbum(name);
  };

  const handleBack = () => setActiveAlbum(null);

  const handleDeleteAlbum = async (e, albumId, albumName) => {
    e.stopPropagation(); // Prevent album opening when clicking delete

    // Confirm deletion
    const confirmDelete = window.confirm(`Are you sure you want to delete "${albumName}" and all its images?`);
    if (!confirmDelete) return;

    try {
      setLoading(true);
      
      // First, delete all images in the album
      const imagesRef = collection(db, "albums", albumId, "images");
      const imagesSnapshot = await getDocs(imagesRef);
      
      const deletePromises = imagesSnapshot.docs.map(doc => 
        deleteDoc(doc.ref)
      );
      await Promise.all(deletePromises);

      // Then delete the album itself
      await deleteDoc(doc(db, "albums", albumId));
      
      // Update state to remove deleted album
      setAlbums(prevAlbums => prevAlbums.filter(album => album.id !== albumId));
      toast.success("Album deleted successfully");
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete album. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (albums.length === 0 && !loading) {
    return (
      <>
        <div className={styles.top}>
          <h3>No albums found.</h3>
          <button onClick={() => setCreateAlbumIntent(!createAlbumIntent)}>
            {!createAlbumIntent ? "Add album" : "Cancel"}
          </button>
        </div>
        {createAlbumIntent && <AlbumForm onAdd={handleAdd} />}
      </>
    );
  }
  if (loading) {
    return (
      <div className={styles.loader}>
        <Spinner color="#0077ff" />
      </div>
    );
  }

  return (
    <>
      {createAlbumIntent && !activeAlbum && (
        <AlbumForm loading={albumAddLoading} onAdd={handleAdd} />
      )}
      {!activeAlbum && (
        <div>
          <div className={styles.top}>
            <h3>My Photo Collections</h3>
            <button
              className={`${createAlbumIntent && styles.active}`}
              onClick={() => setCreateAlbumIntent(!createAlbumIntent)}
            >
              {!createAlbumIntent ? "Add album" : "Cancel"}
            </button>
          </div>
          <div className={styles.albumsList}>
            {albums.map((album) => (
              <div
                key={album.id}
                className={styles.album}
                onClick={() => handleClick(album.name)}
              >
                <div 
                  className={styles.deleteAlbum}
                  onClick={(e) => handleDeleteAlbum(e, album.id, album.name)}
                  title="Delete album"
                >
                  <img src="/assets/trash-bin.png" alt="delete" />
                </div>
                <img src="/assets/photos.png" alt="images" />
                <span>{album.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {activeAlbum && (
        <ImagesList
          albumId={albums.find((a) => a.name === activeAlbum).id}
          albumName={activeAlbum}
          onBack={handleBack}
        />
      )}
    </>
  );
};
