
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
        This applet trains a classifier based on random data with two features. The training data contains 3
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
                "name": "seed",
                "description": "Random seed (generates training data)",
                "type": "numeric",
                "value": 0
            }
        ],
        "returns": "base-64-image"
    }

@functools.cache
def compute(input):
    input = json.loads(input)
    random_state = int(input["seed"])
    classifier = input["classifier"]

    # import some data to play with
    (X, y) = datasets.make_classification(n_features=2, n_redundant=0, n_classes=3, n_clusters_per_class=1,
        random_state=random_state)

    h = 0.02  # step size in the mesh
    # create a mesh to plot in
    x_min, x_max = X[:, 0].min() - 1, X[:, 0].max() + 1
    y_min, y_max = X[:, 1].min() - 1, X[:, 1].max() + 1

    if classifier == "Gaussian Process Classifier":
        kernel = 1.0 * RBF([1.0])
        classifier = GaussianProcessClassifier(kernel=kernel)
    elif classifier == "Logistic Regression":
        classifier = LogisticRegression()
    elif classifier == "Decision Tree":
        classifier = DecisionTreeClassifier(max_depth=5)
    elif classifier == "Support Vector Machine (RBF)":
        classifier = SVC(gamma=2, C=1, probability=True)
    elif classifier == "K-nearest Neighbors":
        classifier = KNeighborsClassifier(n_neighbors=5)
    elif classifier == "Random Forest":
        classifier = RandomForestClassifier(max_depth=5, n_estimators=10, max_features=1)

    classifier.fit(X, y)
    xx, yy = np.meshgrid(np.arange(x_min, x_max, h), np.arange(y_min, y_max, h))

    plt.figure(figsize=(10, 8))

    Z = classifier.predict_proba(np.c_[xx.ravel(), yy.ravel()])

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
