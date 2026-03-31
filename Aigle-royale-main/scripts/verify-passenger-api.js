async function testFetch() {
    const tripId = 'e248975a-e534-4ce5-b687-440a9503c81c'
    const url = `http://localhost:3000/api/super-agent/check-in/${tripId}/passengers`

    console.log('Fetching:', url)
    try {
        const res = await fetch(url)
        console.log('Status:', res.status)
        if (res.ok) {
            const data = await res.json()
            console.log('Passengers count:', data.length)
            const target = data.find(p => p.ticketNumber === 'AR-MKR19ESO-3IJI')
            if (target) {
                console.log('Success! Found ticket in API response.')
                console.log('Baggage:', target.baggageCount, 'at', target.baggageWeight)
            } else {
                console.log('Failure: Ticket not found in API response.')
                console.log('Ticket numbers in response:', data.map(p => p.ticketNumber))
            }
        } else {
            console.log('Error data:', await res.text())
        }
    } catch (err) {
        console.error('Fetch failed:', err)
    }
}

testFetch()
