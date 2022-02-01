
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
import io, base64
import random
import functools
import json

def front_matter():
    return {
        "name": "Scikit-learn Classifiers demo",
        "description": """
        This applet trains a classifier based on random data with two features. The training data contains 2 or 3
        classes.
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
                    "Concentric circles",
                    "Moons"
                ],
                "value": "Random (3 classes)"
            },
            {
                "name": "seed",
                "description": "Random seed",
                "type": "numeric",
                "value": 42
            }
        ],
        "returns": "base-64-image"
    }

@functools.cache
def compute(input):
    # hack only used for memoization; not necessary in general for python <-> javascript
    # communication
    input = json.loads(input)
    classifier = input["classifier"]
    dataset_type = input["dataset_type"]
    random_state = int(input["seed"])

    if dataset_type == "Random (3 classes)":
        (X, y) = datasets.make_classification(n_samples=200, n_features=2, n_redundant=0, n_classes=3, n_clusters_per_class=1,
            random_state=random_state)
    elif dataset_type == "Concentric circles":
        (X, y) = datasets.make_circles(n_samples=200, noise=0.2, factor=0.5, random_state=random_state)
    elif dataset_type == "Moons":
        (X, y) = datasets.make_moons(n_samples=200, noise=0.2, random_state=random_state)
    n_classes = len(np.unique(y))

    h = 0.02  # step size in the mesh
    # create a mesh to plot in
    x_min, x_max = X[:, 0].min() - 1, X[:, 0].max() + 1
    y_min, y_max = X[:, 1].min() - 1, X[:, 1].max() + 1

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

    clf.fit(X, y)
    xx, yy = np.meshgrid(np.arange(x_min, x_max, h), np.arange(y_min, y_max, h))

    plt.figure(figsize=(10, 8))

    Z = clf.predict_proba(np.c_[xx.ravel(), yy.ravel()])
    # if there are fewer than 3 classes, pad with 0s
    if n_classes < 3:
        Z = np.pad(Z, [(0, 0), (0, 3-n_classes)])
        print(Z.shape)

    # Put the result into a color plot
    Z = Z.reshape((xx.shape[0], xx.shape[1], 3))
    plt.imshow(Z, extent=(x_min, x_max, y_min, y_max), origin="lower")

    # Plot also the training points
    plt.scatter(X[:, 0], X[:, 1], c=np.array(["r", "g", "b"])[y], edgecolors=(0, 0, 0))
    plt.xlabel("Feature 1")
    plt.ylabel("Feature 2")
    plt.xlim(xx.min(), xx.max())
    plt.ylim(yy.min(), yy.max())

    plt.title(classifier)

    plt.tight_layout()
    buf = io.BytesIO()
    plt.savefig(buf, format='png')
    buf.seek(0)

    return 'data:image/png;base64,' + base64.b64encode(buf.read()).decode('UTF-8')
