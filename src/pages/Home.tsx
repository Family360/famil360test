import { useAuth } from "@/hooks/useAuth";

const Home = () => {
  const { user, logout } = useAuth();

  return (
    <div style={{ padding: 20 }}>
      <h1>Welcome, {user?.displayName || user?.email || "Guest"}!</h1>
      <button onClick={logout}>Log Out</button>
    </div>
  );
};

export default Home;
