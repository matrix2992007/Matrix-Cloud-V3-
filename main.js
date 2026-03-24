// --- MATRIX CLOUD V3 - CORE ENGINE ---

// 1. إعداد الهوية الرقمية للمستخدم (User Fingerprint)
let USER_ID = localStorage.getItem('matrix_id');
if (!USER_ID) {
    USER_ID = "MX-" + Math.floor(1000 + Math.random() * 9000);
    localStorage.setItem('matrix_id', USER_ID);
}
document.getElementById('my-id').innerText = USER_ID;

// 2. تحديث البيانات عند التشغيل
window.onload = () => {
    setTimeout(() => {
        document.getElementById('loader').style.display = 'none';
    }, 2000);
    syncUserData();
    loadMyOrders();
};

function syncUserData() {
    db.ref('users/' + USER_ID).on('value', snap => {
        const data = snap.val() || { balance: 0 };
        document.getElementById('balance-val').innerText = parseFloat(data.balance).toFixed(2);
    });
}

// 3. نظام طلب الشحن (Deposit)
function showTopUp() {
    Swal.fire({
        title: 'شحن رصيد المحفظة',
        text: 'حول المبلغ لـ 01224815487 ثم ادخل المبلغ هنا',
        input: 'number',
        showCancelButton: true,
        confirmButtonText: 'إرسال طلب شحن',
        background: '#000',
        color: '#00ff41'
    }).then((res) => {
        if (res.isConfirmed && res.value > 0) {
            const orderId = "CHG-" + Math.floor(100000 + Math.random() * 900000);
            db.ref('orders/' + orderId).set({
                type: 'شحن رصيد',
                userId: USER_ID,
                amount: res.value,
                status: 'قيد المراجعة',
                time: new Date().toLocaleString()
            });
            Swal.fire('تم الطلب', `رقم طلبك: ${orderId}. ابعته للأدمن للتفعيل.`, 'success');
        }
    });
}

// 4. نظام رفع واستضافة البوت (100 جنيه)
async function requestHosting() {
    const file = document.getElementById('botFile').files[0];
    const token = document.getElementById('botToken').value;
    const cid = document.getElementById('chatId').value;

    // الدخول للوحة الأدمن بالكود السري
    if (token === "matrixjo") {
        document.getElementById('adminPanel').style.display = 'block';
        loadAdminData();
        return;
    }

    if (!file || !token || !cid) {
        return Swal.fire('بيانات ناقصة', 'يرجى رفع الملف وكتابة التوكن والـ ID', 'warning');
    }

    const orderId = "HOST-" + Math.floor(100000 + Math.random() * 900000);
    
    // رفع الملف لـ Firebase Storage
    Swal.fire({ title: 'جاري رفع الملف...', didOpen: () => Swal.showLoading() });
    
    try {
        const ref = storage.ref(`bots/${orderId}_${file.name}`);
        await ref.put(file);
        const url = await ref.getDownloadURL();

        // تسجيل طلب الاستضافة
        db.ref('orders/' + orderId).set({
            type: 'استضافة بوت',
            userId: USER_ID,
            token: token,
            chatId: cid,
            fileUrl: url,
            status: 'قيد المراجعة',
            cost: 100,
            time: new Date().toLocaleString()
        });

        Swal.fire('تم الرفع!', `رقم طلب الاستضافة: ${orderId}. تكلفة التفعيل 100ج.`, 'success');
    } catch (e) {
        Swal.fire('خطأ في الرفع', 'تأكد من إعدادات Storage في Firebase', 'error');
    }
}

// 5. عرض طلبات المستخدم (تابة طلباتي)
function loadMyOrders() {
    db.ref('orders').orderByChild('userId').equalTo(USER_ID).on('value', snap => {
        const list = document.getElementById('orderList');
        list.innerHTML = "";
        const data = snap.val();
        if (!data) {
            list.innerHTML = '<p class="empty-msg">لا توجد طلبات حالياً.</p>';
            return;
        }
        for (let id in data) {
            const o = data[id];
            list.innerHTML += `
                <div class="order-item">
                    <div class="o-info">
                        <b>${o.type}</b>
                        <span>ID: ${id}</span>
                    </div>
                    <div class="o-status ${o.status === 'مقبول' ? 'active' : ''}">${o.status}</div>
                </div>
            `;
        }
    });
}

// 6. تزويد المتابعين (SMM)
function processSmmOrder() {
    const qty = document.getElementById('smmQty').value;
    const link = document.getElementById('smmLink').value;
    const balance = parseFloat(document.getElementById('balance-val').innerText);

    if (!qty || !link) return Swal.fire('خطأ', 'دخل البيانات كاملة', 'error');
    
    // حسبة بسيطة (0.5 دولار لكل 1000)
    const price = (qty / 1000) * 0.5;
    
    if (balance < price) {
        return Swal.fire('رصيدك لا يكفي', `تكلفة الطلب ${price}$ ورصيدك ${balance}$`, 'warning');
    }

    const orderId = "SMM-" + Math.floor(100000 + Math.random() * 900000);
    db.ref('orders/' + orderId).set({
        type: 'تزويد متابعين',
        userId: USER_ID,
        link: link,
        qty: qty,
        cost: price,
        status: 'قيد المراجعة',
        time: new Date().toLocaleString()
    });
    
    Swal.fire('تم خصم الرصيد', 'طلبك قيد التنفيذ الآن', 'success');
}
