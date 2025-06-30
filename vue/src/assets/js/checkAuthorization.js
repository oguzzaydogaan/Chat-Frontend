export default function checkAuthorization(){
    const expiresIn = localStorage.getItem('expiresIn')
    const currentTime = new Date().toISOString()
    if (!localStorage.getItem('token') || !expiresIn) {
        window.location.href = '/'
        return
    }
    else if (new Date(expiresIn) < new Date(currentTime)) {
        localStorage.removeItem('token')
        localStorage.removeItem('expiresIn')
        window.location.href = '/'
    }
}