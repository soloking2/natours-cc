import axios from 'axios';
import {showAlert} from './alert';

// Type either password or data
export const updateSettings = async (data, type) => {
    try {
        const url = type === 'password' 
        ? '/api/v1/users/updateMyPassword' 
        : '/api/v1/users/updateMe';
        const updateUserData = await axios({
            method: 'PATCH',
            url,
            data
        });

        if(updateUserData.data.status === 'success') {
            showAlert('success','Data updated successfully');
        }
        
    } catch (error) {
        showAlert('error', error.response.data.message);
    }
}