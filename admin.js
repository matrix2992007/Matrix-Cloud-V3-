// --- MATRIX CLOUD V3 - ADMIN MASTER PANEL ---

// 1. وظيفة جلب وإدارة البيانات الضخمة
function loadAdminData() {
    console.log("Welcome, Matrix Admin.");
    const adminContent = document.getElementById('adminContent');
    adminContent.innerHTML = '<p style="text-align:center; color:#888;">جاري سحب طلبات المستخدمين...</p>';

    // سحب كل الطلبات من Firebase
    db.ref('orders').on('value', snap => {
        const orders = snap.val();
        adminContent.innerHTML = ""; // مسح الشاشة للتحديث

        if (!orders) {
            adminContent.innerHTML = '<p style="text-align:center; color:#555;">لا توجد طلبات معلقة حالياً.</p>';
            return;
        }

        // تحويل الكائن لمصفوفة لترتيبها (الأحدث أولاً)
        for (let id in orders) {
            const o = orders[id];
            
            // إنشاء كارت لكل طلب
            const card = document.createElement('div');
            card.className = `admin-card ${o.status === 'قيد المراجعة' ? 'pending-border' : ''}`;
            card.innerHTML = `
                <div class="card-info">
                    <span class="order-type">${o.type}</span>
                    <span class="order-id">ID: ${id}</span>
                    <hr>
                    <p>المستخدم: <b>${o.userId}</b></p>
                    <p>التفاصيل: ${o.amount ? o.amount + ' جنيه' : o.qty ? o.qty + ' متابع' : 'ملف بوت'}</p>
                    <p>الحالة: <b class="status-txt">${o.status}</b></p>
                    <p class="time">${o.time}</p>
                </div>
                <div class="card-actions">
                    ${o.status === 'قيد المراجعة' ? `
                        <button class="btn-approve" onclick="approveOrder('${id}', '${o.type}', '${o.userId}', ${o.amount || o.cost || 0})">قبول ✅</button>
                        <button class="btn-reject" onclick="changeStatus('${id}', 'مرفوض')">رفض ❌</button>
                    ` : `<span class="done-msg">تمت المعالجة</span>`}
                </div>
            `;
            adminContent.prepend(card); // إضافة الطلبات الجديدة فوق
        }
        
        // تحديث الإحصائيات السريعة
        document.getElementById('total-orders').innerText = Object.keys(orders).length;
    });
}

// 2. وظيفة البحث برقم الطلب
function activateOrder() {
    const searchId = document.getElementById('searchOrderId').value.trim();
    if (!searchId) return Swal.fire('تنبيه', 'أدخل رقم الطلب أولاً', 'info');

    db.ref('orders/' + searchId).once('value', snap => {
        const data = snap.val();
        if (data) {
            Swal.fire({
                title: `طلب: ${data.type}`,
                text: `المستخدم: ${data.userId} | الحالة: ${data.status}`,
                showCancelButton: true,
                confirmButtonText: 'تفعيل الآن ✅',
                cancelButtonText: 'إغلاق',
                confirmButtonColor: '#00ff41'
            }).then(res => {
                if (res.isConfirmed) approveOrder(searchId, data.type, data.userId, data.amount || data.cost || 0);
            });
        } else {
            Swal.fire('غير موجود', 'رقم الطلب ده مش مسجل عندي يا بطل', 'error');
        }
    });
}

// 3. المحرك المالي (القبول والتفعيل)
function approveOrder(id, type, userId, amount) {
    // تحديث الحالة لمقبول
    db.ref('orders/' + id).update({ status: 'مقبول' });

    // لو الطلب "شحن رصيد"، نضيف فلوس للمستخدم
    if (type === 'شحن رصيد') {
        db.ref('users/' + userId + '/balance').transaction(current => {
            // هنا بنحول الجنيه لدولار (مثلاً الـ 100 جنيه بـ 2 دولار)
            const addedBalance = amount / 50; 
            return (current || 0) + addedBalance;
        });
        Swal.fire('تم الشحن', `تم إضافة الرصيد لحساب ${userId} بنجاح`, 'success');
    } 
    
    // لو الطلب "استضافة"، ممكن نبعت إشعار أو نفعل السيرفر
    else if (type === 'استضافة بوت') {
        Swal.fire('تم التفعيل', 'تم قبول ملف الاستضافة بنجاح', 'success');
    }
}

// 4. تغيير الحالة فقط (رفض مثلاً)
function changeStatus(id, newStatus) {
    db.ref('orders/' + id).update({ status: newStatus });
    Swal.fire('تم', `تم تغيير حالة الطلب إلى ${newStatus}`, 'info');
}
