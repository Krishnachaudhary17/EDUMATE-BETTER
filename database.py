from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

# --- AUTH ---
class Teacher(db.Model):
    id = db.Column(db.String(80), primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(120), nullable=False)
    notepad = db.Column(db.Text, default="") 
    def to_dict(self): return {'id': self.id, 'name': self.name, 'email': self.email, 'notepad': self.notepad}

# --- CLASS & STUDENTS ---
class Class(db.Model):
    id = db.Column(db.String(80), primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    coordinator_name = db.Column(db.String(120), nullable=False)
    coordinator_phone = db.Column(db.String(20))
    students = db.relationship('Student', backref='class', lazy=True, cascade="all, delete-orphan")
    exams = db.relationship('Exam', backref='class', lazy=True, cascade="all, delete-orphan")
    def to_dict(self): return {'id': self.id, 'name': self.name, 'coordinatorName': self.coordinator_name, 'coordinatorPhone': self.coordinator_phone, 'students': [s.to_dict() for s in self.students]}

class Student(db.Model):
    id = db.Column(db.String(80), primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    roll = db.Column(db.String(20), nullable=False)
    email = db.Column(db.String(120), default='')
    status = db.Column(db.String(50), default='Day Scholar')
    phone = db.Column(db.String(20), default='')
    parent_phone = db.Column(db.String(20), default='')
    address = db.Column(db.Text, default='') 
    previous_marks = db.Column(db.Text, default='') 
    class_id = db.Column(db.String(80), db.ForeignKey('class.id'), nullable=False)
    scores = db.relationship('Score', backref='student', lazy=True, cascade="all, delete-orphan")
    attendance_records = db.relationship('Attendance', backref='student', lazy=True, cascade="all, delete-orphan")

    def to_dict(self):
        return {
            'id': self.id, 'name': self.name, 'roll': self.roll, 'email': self.email,
            'status': self.status, 'phone': self.phone, 'parentPhone': self.parent_phone,
            'address': self.address, 'previousMarks': self.previous_marks
        }

# --- TIMETABLE ---
class Timetable(db.Model):
    id = db.Column(db.String(80), primary_key=True)
    day = db.Column(db.String(20), nullable=False)
    time = db.Column(db.String(20), nullable=False)
    subject = db.Column(db.String(100), nullable=False)
    teacher = db.Column(db.String(100))
    location = db.Column(db.String(100))
    def to_dict(self): return {'id': self.id, 'day': self.day, 'time': self.time, 'subject': self.subject, 'teacher': self.teacher, 'location': self.location}

# --- NOTIFICATIONS ---
class Notification(db.Model):
    id = db.Column(db.String(80), primary_key=True)
    message = db.Column(db.String(500), nullable=False)
    class_name = db.Column(db.String(100), nullable=False)
    timestamp = db.Column(db.String(50), nullable=False)
    def to_dict(self): return {'id': self.id, 'message': self.message, 'className': self.class_name, 'timestamp': self.timestamp}

# --- ATTENDANCE ---
# --- ATTENDANCE ---
class Attendance(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    date = db.Column(db.String(20), nullable=False)
    student_id = db.Column(db.String(80), db.ForeignKey('student.id'), nullable=False)
    student_name = db.Column(db.String(120), nullable=False)
    class_name = db.Column(db.String(120), nullable=False)
    status = db.Column(db.String(10), nullable=False)
    
    # --- THIS LINE WAS MISSING THE NAMES ---
    def to_dict(self): 
        return {
            'id': self.id, 
            'date': self.date, 
            'studentId': self.student_id, 
            'studentName': self.student_name, # <--- Added this
            'className': self.class_name,     # <--- Added this
            'status': self.status
        }

# --- EXAMS & SCORES ---
class Exam(db.Model):
    id = db.Column(db.String(80), primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    total_marks = db.Column(db.Integer, nullable=False)
    class_id = db.Column(db.String(80), db.ForeignKey('class.id'), nullable=False)
    def to_dict(self): return {'id': self.id, 'title': self.title, 'totalMarks': self.total_marks, 'classId': self.class_id}

class Score(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    exam_id = db.Column(db.String(80), db.ForeignKey('exam.id'), nullable=False)
    student_id = db.Column(db.String(80), db.ForeignKey('student.id'), nullable=False)
    marks_obtained = db.Column(db.String(20), default="0")
    def to_dict(self): return {'examId': self.exam_id, 'studentId': self.student_id, 'marks': self.marks_obtained}

# --- ASSIGNMENTS & MATERIALS (UPDATED) ---
class Assignment(db.Model):
    id = db.Column(db.String(80), primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    class_name = db.Column(db.String(100), nullable=False)
    date = db.Column(db.String(50), nullable=False)
    # NEW COLUMN FOR CATEGORY (Assignment vs Note)
    category = db.Column(db.String(50), default='Assignment') 
    
    def to_dict(self): 
        return {
            'id': self.id, 
            'title': self.title, 
            'className': self.class_name, 
            'date': self.date,
            'category': self.category
        }
