work_bp = Blueprint("work", __name__)

@work_bp.post("/work")
def work():
    return true