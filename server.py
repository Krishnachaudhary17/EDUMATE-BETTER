import os
import uuid
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename
from database import db, Class, Student, Teacher, Timetable, Notification, Attendance, Exam, Score

app = Flask(__name__)
CORS(app)

# --- CONFIGURATION ---
base_dir = os.path.abspath(os.path.dirname(__file__))
db_path = os.path.join(base_dir, 'edumate.db')
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + db_path
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# --- UPLOAD CONFIG ---
UPLOAD_FOLDER = os.path.join(base_dir, 'static', 'uploads')
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
os.makedirs(UPLOAD_FOLDER, exist_ok=True) # Create folder if missing

db.init_app(app)

with app.app_context():
    db.create_all()

# --- SERVE STATIC FILES ---
@app.route('/')
def index(): return send_from_directory('.', 'index.html')
@app.route('/app.js')
def app_js(): return send_from_directory('.', 'app.js')
@app.route('/style.css')
def style_css(): return send_from_directory('.', 'style.css')

# --- AUTH ---
@app.route('/api/signup', methods=['POST'])
def signup():
    data = request.json
    if Teacher.query.filter_by(email=data['email']).first(): return jsonify({'error': 'Email exists'}), 400
    new_teacher = Teacher(id="t"+str(uuid.uuid4())[:8], name=data['name'], email=data['email'], password=data['password'])
    db.session.add(new_teacher)
    db.session.commit()
    return jsonify(new_teacher.to_dict()), 201

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    t = Teacher.query.filter_by(email=data['email']).first()
    if t and t.password == data['password']: return jsonify(t.to_dict())
    return jsonify({'error': 'Invalid credentials'}), 401

# --- CLASSES ---
@app.route('/api/classes', methods=['GET', 'POST'])
def handle_classes():
    if request.method == 'GET': return jsonify([c.to_dict() for c in Class.query.all()])
    data = request.json
    c = Class(id="c"+str(uuid.uuid4())[:8], name=data['name'], coordinator_name=data['coordinatorName'], coordinator_phone=data['coordinatorPhone'])
    db.session.add(c)
    db.session.commit()
    return jsonify(c.to_dict()), 201

@app.route('/api/classes/<cid>', methods=['DELETE'])
def delete_class(cid):
    c = Class.query.get(cid)
    if c: db.session.delete(c); db.session.commit(); return jsonify({'msg': 'Deleted'})
    return jsonify({'error': 'Not found'}), 404

# --- STUDENTS ---
@app.route('/api/classes/<cid>/students', methods=['POST'])
def add_student(cid):
    data = request.json
    
    # Check for Duplicate Roll No in this Class
    existing = Student.query.filter_by(class_id=cid, roll=data['roll']).first()
    if existing:
        return jsonify({'error': f"Roll Number {data['roll']} already exists in this class!"}), 400

    s = Student(
        id="s"+str(uuid.uuid4())[:8], name=data['name'], roll=data['roll'], 
        email=data.get('email',''), status=data.get('status','Day Scholar'),
        phone=data.get('phone',''), parent_phone=data.get('parentPhone',''),
        class_id=cid
    )
    db.session.add(s)
    db.session.commit()
    return jsonify(s.to_dict()), 201

@app.route('/api/students/<sid>', methods=['PUT'])
def update_student(sid):
    s = Student.query.get(sid)
    if not s: return jsonify({'error': 'Not found'}), 404
    data = request.json
    if 'address' in data: s.address = data['address']
    if 'previousMarks' in data: s.previous_marks = data['previousMarks']
    if 'status' in data: s.status = data['status']
    if 'phone' in data: s.phone = data['phone']
    if 'parentPhone' in data: s.parent_phone = data['parentPhone']
    db.session.commit()
    return jsonify(s.to_dict())

@app.route('/api/students/<sid>', methods=['DELETE'])
def delete_student(sid):
    s = Student.query.get(sid)
    if s: db.session.delete(s); db.session.commit(); return jsonify({'msg': 'Deleted'})
    return jsonify({'error': 'Not found'}), 404

@app.route('/api/students/<sid>/analytics', methods=['GET'])
def get_analytics(sid):
    recs = Attendance.query.filter_by(student_id=sid).all()
    total = len(recs)
    present = len([r for r in recs if r.status == 'P'])
    percentage = round((present/total*100),1) if total>0 else 0
    scores = Score.query.filter_by(student_id=sid).all()
    exam_data = []
    for sc in scores:
        ex = Exam.query.get(sc.exam_id)
        if ex: exam_data.append({'title': ex.title, 'total': ex.total_marks, 'obtained': sc.marks_obtained})
    return jsonify({'attendance': {'percentage': percentage, 'present': present, 'total': total}, 'exams': exam_data})

# --- FILE UPLOAD ROUTE ---
@app.route('/api/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files: return jsonify({'error': 'No file part'}), 400
    file = request.files['file']
    if file.filename == '': return jsonify({'error': 'No selected file'}), 400
    
    if file:
        filename = secure_filename(file.filename)
        unique_filename = str(uuid.uuid4())[:8] + "_" + filename
        file.save(os.path.join(app.config['UPLOAD_FOLDER'], unique_filename))
        
        # Generate URL
        file_url = request.host_url + 'static/uploads/' + unique_filename
        return jsonify({'url': file_url})

# --- TIMETABLE ---
@app.route('/api/timetable', methods=['GET', 'POST'])
def handle_timetable():
    if request.method == 'GET': return jsonify([t.to_dict() for t in Timetable.query.all()])
    db.session.add(Timetable(id="tt"+str(uuid.uuid4())[:8], **request.json))
    db.session.commit()
    return jsonify({'msg': 'Added'}), 201

@app.route('/api/timetable/<id>', methods=['DELETE'])
def delete_timetable(id):
    t = Timetable.query.get(id)
    if t: db.session.delete(t); db.session.commit(); return jsonify({'msg': 'Deleted'})
    return jsonify({'error': 'Not found'}), 404

# --- NOTIFICATIONS ---
@app.route('/api/notifications', methods=['GET', 'POST'])
def handle_notifications():
    if request.method == 'GET': return jsonify([n.to_dict() for n in Notification.query.all()])
    data = request.json
    db.session.add(Notification(id="n"+str(uuid.uuid4())[:8], message=data['message'], class_name=data['className'], timestamp=data['timestamp']))
    db.session.commit()
    return jsonify({'msg': 'Added'}), 201

# --- ATTENDANCE ---
@app.route('/api/attendance', methods=['POST', 'GET'])
def handle_attendance():
    if request.method == 'POST':
        for r in request.json:
            ex = Attendance.query.filter_by(date=r['date'], student_id=r['studentId']).first()
            if ex: ex.status = r['status']
            else: db.session.add(Attendance(date=r['date'], student_id=r['studentId'], student_name=r['studentName'], class_name=r['className'], status=r['status']))
        db.session.commit()
        return jsonify({'msg': 'Saved'}), 201
    return jsonify([r.to_dict() for r in Attendance.query.all()])

# --- EXAMS ---
@app.route('/api/exams', methods=['GET', 'POST'])
def handle_exams():
    if request.method == 'GET': return jsonify([e.to_dict() for e in Exam.query.all()])
    data = request.json
    db.session.add(Exam(id="e"+str(uuid.uuid4())[:8], title=data['title'], total_marks=data['totalMarks'], class_id=data['classId']))
    db.session.commit()
    return jsonify({'msg': 'Created'}), 201

@app.route('/api/exams/<eid>', methods=['DELETE'])
def delete_exam(eid):
    e = Exam.query.get(eid)
    if e: Score.query.filter_by(exam_id=eid).delete(); db.session.delete(e); db.session.commit(); return jsonify({'msg': 'Deleted'})
    return jsonify({'error': 'Not found'}), 404

@app.route('/api/scores', methods=['POST', 'GET'])
def handle_scores():
    if request.method == 'POST':
        for r in request.json:
            ex = Score.query.filter_by(exam_id=r['examId'], student_id=r['studentId']).first()
            if ex: ex.marks_obtained = r['marks']
            else: db.session.add(Score(exam_id=r['examId'], student_id=r['studentId'], marks_obtained=r['marks']))
        db.session.commit()
        return jsonify({'msg': 'Saved'}), 201
    eid = request.args.get('examId')
    if eid: return jsonify([s.to_dict() for s in Score.query.filter_by(exam_id=eid).all()])
    return jsonify([])

if __name__ == '__main__':
    app.run(debug=True, port=5000)