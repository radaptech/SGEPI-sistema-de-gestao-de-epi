import DashboardCard from "../DashboardCard";

function DashboardCards({
  cards,
  abrirDetalhes,
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 2xl:grid-cols-6 gap-3">
      {cards.map((card) => (
        <DashboardCard
          key={card.id}
          card={card}
          onClick={() =>
            abrirDetalhes(card.id)
          }
        />
      ))}
    </div>
  );
}

export default DashboardCards;