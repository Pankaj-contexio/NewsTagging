
async function updatepartyrating(cardid, countryId) {
    const card = document.getElementById(cardid);
    const addRate = card.querySelector('.party-country-selector').value;
    const removeRate = Array.from(
            card.querySelectorAll('.party-options input[type="checkbox"]:checked')
            ).map(cb => cb.value);
    let partyRating = card.querySelector('.radio-group input[name="add-rating"]:checked')?.value || null;

    if (!addRate || !removeRate || !partyRating ) {
        alertPopup("Please fill all fields");
        return;
    }
    // if (removeRate !== 'All') {
    //     removePartyRating = partyRating;
    //     card.querySelector('.remove-party_rating').value = removePartyRating;
    // }
    const data = {
        addRate: addRate,
        removeRate: removeRate,
        partyRating: partyRating,
        countryId: countryId
    };
    try {
        const response = await fetch('/api/analytics', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            const result = await response.json();
            alertPopup(result.message);
            // Optionally, you can refresh the page or update the UI
           
        } else {
            const error = await response.json();
            alertPopup(error.message || "An error occurred while updating ratings.");
        }
    } catch (error) {
        console.error("Error:", error);
        alertPopup("An unexpected error occurred.");
    }


}


async function updateForeignRelation(cardid) {
    const card = document.getElementById(cardid);
    const countryRelation = card.querySelector('.foreign-country-selector').value;
    const rateCountry = Array.from(
            card.querySelectorAll('.foreign-options input[type="checkbox"]:checked')
            ).map(cb => cb.value);
    
    const countryRating = card.querySelector('.radio-group input[name="fp-rating"]:checked')?.value || null;

    if (!countryRelation || !rateCountry || !countryRating) {
        alertPopup("Please fill all fields");
        return;
    }

    const data = {
        countryRelation: countryRelation,
        rateCountry: rateCountry,
        countryRating: countryRating
    };

    try {
        const response = await fetch('/api/relations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            const result = await response.json();
            alertPopup(result.message);
            // Optionally, you can refresh the page or update the UI
            
        } else {
            const error = await response.json();
            alertPopup(error.message || "An error occurred while updating foreign relations.");
        }
    } catch (error) {
        console.error("Error:", error);
        alertPopup("An unexpected error occurred.");
    }
}


async function updateEconomy(cardid, countryId) {
    const card = document.getElementById(cardid);
    const tradeWith = card.querySelector('.economy-country-selector').value;
    const sectors = Array.from(
            card.querySelectorAll('.economy-options input[type="checkbox"]:checked')
            ).map(cb => cb.value);
    const tradevalue = card.querySelector('.trade-value').value;
    if(!tradevalue || !tradeWith || !sectors){
        alertPopup("input missing!")
    }

    const data = {
        country_id: countryId,
        sector_name: sectors,
        partner: tradeWith,
        value: tradevalue
    }
    try {
        const response = await fetch('/api/economy', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            const result = await response.json();
            alertPopup(result.message);
            // Optionally, you can refresh the page or update the UI
            
        } else {
            const error = await response.json();
            alertPopup(error.message || "An error occurred while updating economy relations.");
        }
    } catch (error) {
        console.error("Error:", error);
        alertPopup("An unexpected error occurred.");
    }
}



