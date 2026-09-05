export default function OverviewPage({ selectedDate, onDateChange }) {
  return (
    <>
      <div className="overview-date-filter"><label htmlFor="overview-date">Ngày hiển thị</label><input id="overview-date" type="date" value={selectedDate} onChange={(event) => onDateChange(event.target.value)} /></div>
     
    </>
  )
}
