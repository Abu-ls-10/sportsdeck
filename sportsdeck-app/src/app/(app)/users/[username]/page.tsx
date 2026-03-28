export default function UserProfilePage({ params }: { params: { username: string } }) {
  return <div>User: {params.username}</div>;
}
