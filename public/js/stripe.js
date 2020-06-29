import axios from 'axios';
import {showAlert} from './alert';
const stripe = Stripe('pk_test_51Gz7GXI7Piew1KH4iyqVzfctZY4WvNImiPGYFgXOVZI5AIjKzjmjSa2o6PpPK79jVOYqkx8EzNA09GKSkmaduXoH00R4fgKgnK');

export const bookTour = async tourId => {
    try {
        // Get checkout session from API
        const session = await axios(
            `http://localhost:3000/api/v1/bookings/checkout-session/${tourId}`
            );
        // Create checkout + charge the credit card
        await stripe.redirectToCheckout({
            sessionId: session.data.session.id
        })
        
    } catch (error) {
        console.log(error);
        showAlert('error', error)
    }


}