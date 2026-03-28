export default function TeamPage({ params }: { params: { team: string } }) {
  return <div>Team: {params.team}</div>;
}
