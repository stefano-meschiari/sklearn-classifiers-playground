# TODO: refactor and comment the entire script
import numpy as np
import matplotlib.pyplot as plt
from sklearn import datasets
from sklearn.gaussian_process import GaussianProcessClassifier
from sklearn.gaussian_process.kernels import RBF
from sklearn.svm import SVC
from sklearn.linear_model import LogisticRegression
from sklearn.neighbors import KNeighborsClassifier
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import minmax_scale
import io, base64, math
import random
import functools
import json

class SklearnClassifiers:
    def __init__(self):
        super()
        self.figure = None
        self.axes = None

    def front_matter(self):
        return {
            "name": "Scikit-learn Classifiers demo",
            "description": """
            This applet trains a classifier based on random data with two features. The training data can contain up to 3
            classes. Click inside the plot to add new points.
            """,
            "inputs": [
                {
                    "name": "classifier",
                    "description": "Type of classifier",
                    "type": "list",
                    "values": [
                        "Logistic Regression",
                        "Decision Tree",
                        "Random Forest",
                        "Support Vector Machine (RBF)",
                        "K-nearest Neighbors",
                        "Gaussian Process Classifier"
                    ],
                    "value": "Logistic Regression"
                },
                {
                    "name": "dataset_type",
                    "description": "Input dataset",
                    "type": "list",
                    "values": [
                        "Random (3 classes)",
                        "Empty (add your own observations)",
                        "Concentric circles",
                        "Moons",
                        "Quadrants"
                    ],
                    "value": "Random (3 classes)"
                },
                {
                    "name": "seed",
                    "description": "Random seed",
                    "type": "numeric",
                    "value": 42
                },
                {
                    "name": "class",
                    "description": "When clicking, add an observation of class...",
                    "type": "list",
                    "values": [
                        "Red",
                        "Green",
                        "Blue"
                    ],
                    "value": "Red"
                },
                {
                    "name": "user_data",
                    "description": "Array of points clicked by the user",
                    "type": "data",
                    "value": []
                }
            ],
            "returns": "base-64-image"
        }

    @functools.lru_cache(maxsize=5)
    def compute(self, input):
        # hack only used for memoization; not necessary in general for python <-> javascript
        # communication
        input = json.loads(input)
        self.last_input = input

        classifier = input["classifier"]
        dataset_type = input["dataset_type"]
        random_state = int(input["seed"])
        user_data = input["user_data"]

        plt.style.use("seaborn-white")

        if dataset_type == "Random (3 classes)":
            (X, y) = datasets.make_classification(n_samples=200, n_features=2, n_redundant=0, n_classes=3, n_clusters_per_class=1,
                random_state=random_state)
        elif dataset_type == "Concentric circles":
            (X, y) = datasets.make_circles(n_samples=400, noise=0.2, factor=0.5, random_state=random_state)
        elif dataset_type == "Moons":
            (X, y) = datasets.make_moons(n_samples=200, noise=0.2, random_state=random_state)
        elif dataset_type == "Empty (add your own observations)":
            (X, y) = ((np.ndarray(shape=(0, 2)), np.array([], dtype="int")))
        elif dataset_type == "Quadrants":
            n_samples = 400
            np.random.seed(random_state)
            X = np.column_stack((np.random.uniform(-1, 1, n_samples),
                                 np.random.uniform(-1, 1, n_samples)))
            y = np.zeros(n_samples, dtype="int")
            y[(X[:, 0] < 0) & (X[:, 1] > 0)] = 1
            y[(X[:, 0] > 0) & (X[:, 1] < 0)] = 1

            if random_state != 0:
                theta = np.random.uniform(0, 2*math.pi)
                rot = np.array((
                    (math.cos(theta), math.sin(theta)),
                    (-math.sin(theta), math.cos(theta))
                ))
                X = X @ rot

        if X.shape[0] > 0:
            X = minmax_scale(X, feature_range=(-1, 1))


        if classifier == "Gaussian Process Classifier":
            kernel = 1.0 * RBF([1.0])
            clf = GaussianProcessClassifier(kernel=kernel, max_iter_predict=50)
        elif classifier == "Logistic Regression":
            clf = LogisticRegression()
        elif classifier == "Decision Tree":
            clf = DecisionTreeClassifier(max_depth=5)
        elif classifier == "Support Vector Machine (RBF)":
            clf = SVC(gamma=2, C=1, probability=True)
        elif classifier == "K-nearest Neighbors":
            clf = KNeighborsClassifier(n_neighbors=5)
        elif classifier == "Random Forest":
            clf = RandomForestClassifier(max_depth=5, n_estimators=20, max_features=1)


        if len(user_data) > 0 and self.axes is not None:
            inv = self.axes.transData.inverted()
            width, height = self.figure.canvas.get_width_height()
            for datum in user_data:
                coord = inv.transform((datum['x'], height-datum['y']))
                print(datum['x'], ", ", datum['y'], " => ",
                      coord[0], ", ", coord[1])
                X = np.vstack((X, coord))
                y = np.append(y, datum['class'])

        plt.close(self.figure)
        self.figure, self.axes = plt.subplots(figsize=(10, 8), dpi=200)
        n_classes = len(np.unique(y))

        if n_classes > 1:
            h = 0.025  # step size in the mesh

            x_min, x_max = -1.5, 1.5
            y_min, y_max = -1.5, 1.5

            xx, yy = np.meshgrid(np.arange(x_min, x_max, h), np.arange(y_min, y_max, h))

            clf.fit(X, y)
            Z = clf.predict_proba(np.c_[xx.ravel(), yy.ravel()])
            # if there are fewer than 3 classes, pad with 0s
            if n_classes < 3:
                Z = np.pad(Z, [(0, 0), (0, 3-n_classes)])

            # Put the result into a color plot
            Z = Z.reshape((xx.shape[0], xx.shape[1], 3))
            plt.imshow(Z,
                extent=(x_min, x_max, y_min, y_max),
                origin="lower",
                alpha=0.8)
        else:
            plt.text(0, 0,
                "Add at least two points of two different classes\nto train this classifier.",
                ha='center', va='center')


        plt.scatter(X[:, 0], X[:, 1],
            c=np.array(["r", "g", "b"])[y],
            edgecolors=(0, 0, 0))

        plt.xlim(-1.5, 1.5)
        plt.ylim(-1.5, 1.5)

        plt.xlabel("Feature 1")
        plt.ylabel("Feature 2")

        plt.title(classifier)

        plt.tight_layout()
        buf = io.BytesIO()
        plt.savefig(buf, format='png')
        buf.seek(0)

        return 'data:image/png;base64,' + base64.b64encode(buf.read()).decode('UTF-8')
